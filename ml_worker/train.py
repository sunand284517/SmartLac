import torch
import torch.nn as nn
import torch.optim as optim
from torchvision import transforms
from torch.utils.data import DataLoader
from model import CowSonogramCNN, CLASSES
from dataset_loader import CowSonogramDataset
import os

def train_model(data_dir, epochs=100, batch_size=32, lr=0.001):
    if torch.cuda.is_available():
        device = torch.device('cuda')
    elif getattr(torch.backends, 'mps', None) and torch.backends.mps.is_available():
        device = torch.device('mps')
    else:
        device = torch.device('cpu')
    print(f"Training on {device}...")
    
    transform = transforms.Compose([
        transforms.RandomResizedCrop(224, scale=(0.8, 1.0)),
        transforms.RandomHorizontalFlip(),
        transforms.RandomRotation(5),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
    ])
    
    if not os.path.exists(data_dir):
        print(f"Dataset directory '{data_dir}' not found.")
        return

    try:
        dataset = CowSonogramDataset(data_dir, transform=transform)
        dataloader = DataLoader(dataset, batch_size=batch_size, shuffle=True, num_workers=4, pin_memory=True)
        print(f"Loaded {len(dataset)} images for multi-task training.")
        
        # Load validation dataset for Early Stopping
        test_data_dir = data_dir.replace('train', 'test')
        test_dataset = CowSonogramDataset(test_data_dir, transform=transforms.Compose([
            transforms.Resize((224, 224)),
            transforms.ToTensor(),
            transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
        ]))
        test_dataloader = DataLoader(test_dataset, batch_size=batch_size, shuffle=False, num_workers=4, pin_memory=True)
        print(f"Loaded {len(test_dataset)} validation images for Early Stopping tracking.")
    except Exception as e:
        print(f"Could not load datasets.")
        print(e)
        return
        
    model = CowSonogramCNN(num_classes=len(CLASSES)).to(device)
    
    criterion_class = nn.CrossEntropyLoss()
    criterion_yield = nn.MSELoss()
    
    optimizer = optim.Adam(model.parameters(), lr=lr, weight_decay=1e-4)
    
    best_val_loss = float('inf')
    patience = 10
    patience_counter = 0
    
    for epoch in range(epochs):
        model.train()
        running_loss = 0.0
        running_class_loss = 0.0
        running_yield_loss = 0.0
        
        for i, (inputs, class_labels, yield_labels) in enumerate(dataloader):
            inputs = inputs.to(device)
            class_labels = class_labels.to(device)
            yield_labels = yield_labels.to(device)
            
            optimizer.zero_grad()
            class_logits, yield_preds = model(inputs)
            
            loss_c = criterion_class(class_logits, class_labels)
            # Alpha/beta can be tuned, but we use 1.0/1.0 initially
            loss_y = criterion_yield(yield_preds, yield_labels)
            
            # Since MSE loss on ~30 yield might be large (like 100), we scale it down slightly
            combined_loss = loss_c + (0.1 * loss_y) 
            
            combined_loss.backward()
            optimizer.step()
            
            running_loss += combined_loss.item()
            running_class_loss += loss_c.item()
            running_yield_loss += loss_y.item()
            
        avg_loss = running_loss / len(dataloader)
        avg_c = running_class_loss / len(dataloader)
        avg_y = running_yield_loss / len(dataloader)
        print(f"Epoch {epoch+1}/{epochs} - Combined Train Loss: {avg_loss:.4f} (Class: {avg_c:.4f}, Yield(MSE): {avg_y:.4f})")
        
        # Validation evaluation loop for Early Stopping
        model.eval()
        val_loss_sum = 0.0
        with torch.no_grad():
            for v_inputs, v_class_labels, v_yield_labels in test_dataloader:
                v_inputs = v_inputs.to(device)
                v_class_labels = v_class_labels.to(device)
                v_yield_labels = v_yield_labels.to(device)
                
                v_class_logits, v_yield_preds = model(v_inputs)
                v_loss_c = criterion_class(v_class_logits, v_class_labels)
                v_loss_y = criterion_yield(v_yield_preds, v_yield_labels)
                
                val_loss_sum += (v_loss_c + (0.1 * v_loss_y)).item()
                
        avg_val_loss = val_loss_sum / len(test_dataloader)
        print(f"   --> Validation Loss: {avg_val_loss:.4f}")
        
        if avg_val_loss < best_val_loss:
            best_val_loss = avg_val_loss
            patience_counter = 0
            torch.save(model.state_dict(), 'cow_model.pth')
            print("   --> Model improved! Weights safely registered.")
        else:
            patience_counter += 1
            print(f"   --> No improvement. Patience tracking: {patience_counter}/{patience}")
            if patience_counter >= patience:
                print(f"\n--- Early Stopping Triggered at Epoch {epoch+1} to avoid overfitting! ---")
                break
                
    print("Training sequence entirely finalized. Best stable model remains at cow_model.pth")

if __name__ == "__main__":
    train_model(data_dir='dataset/train')

