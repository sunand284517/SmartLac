import os
import random
import time
from PIL import Image
import torch
import torch.nn as nn
import torchvision.transforms as transforms

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
        # Shared Convolutional Feature Extractor
        self.features = nn.Sequential(
            nn.Conv2d(3, 16, kernel_size=3, padding=1),
            nn.BatchNorm2d(16),
            nn.ReLU(),
            nn.MaxPool2d(2, 2),
            
            nn.Conv2d(16, 32, kernel_size=3, padding=1),
            nn.BatchNorm2d(32),
            nn.ReLU(),
            nn.MaxPool2d(2, 2),
            
            nn.Conv2d(32, 64, kernel_size=3, padding=1),
            nn.BatchNorm2d(64),
            nn.ReLU(),
            nn.MaxPool2d(2, 2)
        )
        
        # Shared Fully Connected Base
        self.fc_layer = nn.Sequential(
            nn.Linear(64 * 28 * 28, 512), 
            nn.ReLU(),
            nn.Dropout(0.5)
        )
        
        # Multi-Task Learning Heads
        self.classification_head = nn.Linear(512, num_classes)
        self.regression_head = nn.Linear(512, 1)
        
    def forward(self, x):
        x = self.features(x)
        x = x.view(x.size(0), -1) # Flatten
        shared_features = self.fc_layer(x)
        
        class_logits = self.classification_head(shared_features)
        yield_pred = self.regression_head(shared_features)
        
        return class_logits, yield_pred

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
    elif yield_val < 20:
        return 'Fresh Cows'
    elif yield_val >= 35:
        return 'Peak Lactation'
    else:
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
