/**
 * Modal System
 * Custom modal dialogs to replace browser alert/confirm
 */

function showConfirm(text, onConfirm) {
    document.getElementById('modal-text').innerText = text;
    document.getElementById('modal-cancel').style.display = 'block';
    
    const confirmBtn = document.getElementById('modal-confirm');
    confirmBtn.innerText = "Yes";
    confirmBtn.onclick = () => {
        closeModal();
        if(onConfirm) onConfirm();
    };
    
    document.getElementById('custom-modal').style.display = 'flex';
}

function showAlert(text) {
    document.getElementById('modal-text').innerText = text;
    document.getElementById('modal-cancel').style.display = 'none';
    
    const confirmBtn = document.getElementById('modal-confirm');
    confirmBtn.innerText = "OK";
    confirmBtn.onclick = closeModal;
    
    document.getElementById('custom-modal').style.display = 'flex';
}

function closeModal() {
    document.getElementById('custom-modal').style.display = 'none';
}