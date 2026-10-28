// Toast part of the bistro terminal (views/toasty/terminal.ejs): only a QR calculator, nothing is submitted

// Toasts: 1 for 25 Kč, 2 for 45 Kč
const TOAST_PRICE = 25;
const TOAST_PAIR_PRICE = 45;

function updateToastQR() {
    renderQR('canvas-toast', Number(document.getElementById('amount-toast').value));
}

document.getElementById('toast').addEventListener('change', (e) => {
    const count = parseInt(e.target.value);
    document.getElementById('amount-toast').value = Math.trunc(count / 2) * TOAST_PAIR_PRICE + (count % 2) * TOAST_PRICE;
    updateToastQR();
});
document.getElementById('amount-toast').addEventListener('input', updateToastQR);
document.getElementById('payment-method-toast').addEventListener('change', (e) => {
    document.getElementById('qr-section-wrap-toast').style.display = e.target.value === 'qr' ? 'block' : 'none';
});
window.addEventListener('load', updateToastQR);
