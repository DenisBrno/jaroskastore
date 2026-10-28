// Product picker, total amount, QR code and payment method switch
// shared by /payment and the bistro terminal (partials/product-picker.ejs, partials/qr-payment.ejs)

const IBAN = document.querySelector('[data-iban]').dataset.iban;

const createSpayd = (amount) => `SPD*1.0*ACC:${IBAN}*AM:${Number(amount).toFixed(2)}*CC:CZK`;

// Draws a QR payment for the amount, hides the canvas when there is nothing to pay
function renderQR(canvasId, amount) {
    const canvas = document.getElementById(canvasId);
    if (!(amount > 0)) {
        canvas.style.display = 'none';
        return;
    }
    canvas.style.display = 'block';
    QRCode.toCanvas(canvas, createSpayd(amount), {
        width: 250,
        margin: 2,
        errorCorrectionLevel: 'M'
    }, (error) => {
        if (error) console.error(error);
    });
}

// Jaroska.store part: the customer pays amount - sleva
function updateQR() {
    const amount = Number(document.getElementById('amount').value) - (parseInt(document.getElementById('sleva').value) || 0);
    renderQR('canvas', amount);
}

function calculateTotal() {
    let total = 0;
    document.querySelectorAll('.product-qty').forEach(input => {
        total += parseInt(input.value) * parseInt(input.dataset.price);
    });
    document.getElementById('amount').value = total;
    updateQR();
}

function updatePayment(method) {
    document.getElementById('qr-section-wrap').style.display = method === 'qr' ? 'block' : 'none';
    document.getElementById('credit-section-wrap').style.display = method === 'credit' ? 'block' : 'none';
}

// +/- buttons next to a quantity input
document.addEventListener('click', (e) => {
    const step = e.target.closest('[data-qty-step]');
    if (step) {
        const input = step.parentElement.querySelector('.qty-input');
        input.value = Math.max(0, (parseInt(input.value) || 0) + Number(step.dataset.qtyStep));
        input.dispatchEvent(new Event('change', { bubbles: true }));
        return;
    }

    const refresh = e.target.closest('[data-qr-refresh]');
    if (refresh) {
        window[refresh.dataset.qrRefresh]();
    }
});

document.addEventListener('change', (e) => {
    if (e.target.matches('.product-qty')) {
        calculateTotal();
    }
});

document.getElementById('amount').addEventListener('input', updateQR);
document.getElementById('sleva').addEventListener('input', updateQR);
document.getElementById('payment-method').addEventListener('change', (e) => updatePayment(e.target.value));
window.addEventListener('load', updateQR);
