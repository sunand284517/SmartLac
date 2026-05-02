import os
import random
import time
from PIL import Image
import torch
import torch.nn as nn
import torchvision.transforms as transforms
import torchvision.models as models

# Define 5 major productive stages
CLASSES = [
    'Dry Period',
    'Peak Lactation',
    'Late Lactation', 
    'Fresh Cows',
    'Peri-Partum'
]

class CowSonogramCNN(nn.Module):
    def __init__(self, num_classes=5):
        super(CowSonogramCNN, self).__init__()
        
        # Load pre-trained InceptionV3
        # Note: InceptionV3 expects 299x299 input
        self.backbone = models.inception_v3(weights=models.Inception_V3_Weights.DEFAULT)
        
        # We'll handle the heads ourselves, so replace the built-in FC
        self.backbone.fc = nn.Identity()
        self.backbone.aux_logits = False # Simplify to avoid secondary loss
        
        # Freeze early layers
        for param in self.backbone.parameters():
            param.requires_grad = False
            
        # Unfreeze the top Inception blocks (Mixed_7b, Mixed_7c) for fine-tuning
        for param in self.backbone.Mixed_7b.parameters():
            param.requires_grad = True
        for param in self.backbone.Mixed_7c.parameters():
            param.requires_grad = True
        
        # InceptionV3 output before FC is 2048 channels
        in_features = 2048 
        
        # Upgraded 2-layer head
        self.fc_layer = nn.Sequential(
            nn.Linear(in_features, 512),
            nn.BatchNorm1d(512),
            nn.ReLU(),
            nn.Dropout(0.5),
            nn.Linear(512, 256),
            nn.BatchNorm1d(256),
            nn.ReLU(),
            nn.Dropout(0.4)
        )
        
        # Multi-Task Learning Heads
        self.classification_head = nn.Linear(256, num_classes)
        self.regression_head = nn.Linear(256, 1)

    def forward(self, x):
        # InceptionV3 forward returns a wrapper object if aux_logits is handled, 
        # but since we set fc=Identity, it returns the 2048 features.
        features = self.backbone(x)
        
        # Ensure we have [Batch, 2048]
        if isinstance(features, torch.Tensor):
            x = features
        else:
            x = features.logits
            
        x = self.fc_layer(x)
        
        class_logits = self.classification_head(x)
        yield_pred = self.regression_head(x)
        
        return class_logits, yield_pred

    @staticmethod
    def get_inference_transform():
        return transforms.Compose([
            transforms.Resize((299, 299)), # InceptionV3 specific
            transforms.ToTensor(),
            transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
        ])

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DEFAULT_MODEL_PATH = os.path.join(BASE_DIR, 'cow_model.pth')

_cached_model = None

def get_model(model_path=DEFAULT_MODEL_PATH):
    global _cached_model
    if _cached_model is None:
        if not os.path.exists(model_path):
            raise FileNotFoundError(f"Model file not found at {model_path}")
        device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
        model = CowSonogramCNN(num_classes=len(CLASSES)).to(device)
        model.load_state_dict(torch.load(model_path, map_location=device, weights_only=True))
        model.eval()
        _cached_model = (model, device)
    return _cached_model

def get_consistent_class(yield_val):
    if yield_val == 0:
        return 'Dry Period'
    elif yield_val <= 10:
        # Peri-Partum: cows around calving, just beginning lactation
        return 'Peri-Partum'
    elif yield_val <= 20:
        # Fresh Cows: recently calved, building up yield
        return 'Fresh Cows'
    elif yield_val >= 35:
        # Peak Lactation: high producing cows
        return 'Peak Lactation'
    else:
        # Late Lactation: 20-35 liters/day
        return 'Late Lactation'
    

def predict_image(image_path, model_path=DEFAULT_MODEL_PATH):
    """
    Given an image path, return a tuple: (classification, confidence, predicted_yield).
    """
    try:
        model, device = get_model(model_path)

        # Preprocess image
        transform = transforms.Compose([
            transforms.Resize((224, 224)),
            transforms.ToTensor(),
            transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
        ])
        
        image = Image.open(image_path).convert('RGB')
        tensor = transform(image).unsqueeze(0).to(device)
        
        with torch.no_grad():
            class_logits, yield_pred = model(tensor)
            
            probabilities = torch.nn.functional.softmax(class_logits, dim=1)
            confidence, predicted_idx = torch.max(probabilities, 1)
            
            final_yield = yield_pred.item()
            # Yield cannot be negative
            if final_yield < 0: final_yield = 0.0
            
            consistent_class = get_consistent_class(final_yield)
            
        return consistent_class, confidence.item(), final_yield
    except Exception as e:
        print(f"Error during real inference: {e}")
        raise RuntimeError(f"Inference failed: {e}")
