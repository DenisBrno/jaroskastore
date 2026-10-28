const { getProductsForSale, updateUserCredit, chargeUserCredit, createMovement, updateInventory } = require('./db');

const PAYMENT_METHODS = ['qr', 'cash', 'credit'];

/**
 * Records a Jaroska.store sale submitted from a payment form (/payment, bistro terminal).
 *
 * Every product must be for sale, otherwise the whole payment is rejected.
 * Expected body: qty-<product> fields, amount, sleva, paymentMethod and userId (for credit).
 * The customer pays amount - sleva. One movement is written per product and the difference
 * between the paid amount and the item prices goes to the first movement's bonus, so the
 * movements add up to the paid amount. Credit payments are deducted once from the selected user;
 * the balance must not be negative before paying but may go below zero after.
 *
 * Returns 'success' or an error code used in the ?error= query of the page.
 */
const recordShopPayment = async (body, { movementType, note, authorId }) => {
    let produkty;
    try {
        produkty = await getProductsForSale();
    } catch (error) {
        console.error('Error loading products:', error);
        return 'loading_products';
    }

    const polozky = [];
    for (const [key, value] of Object.entries(body)) {
        const quantity = parseInt(value);
        if (key.startsWith('qty-') && quantity > 0) {
            const productName = key.replace('qty-', '');
            const produktData = produkty.find(p => p.produkt === productName);
            if (!produktData) {
                return 'not_for_sale';
            }
            polozky.push({ nazev: productName, mnozstvi: quantity, cena: Number(produktData.cena) });
        }
    }

    if (polozky.length === 0) {
        return 'empty';
    }

    const cenaPolozek = polozky.reduce((sum, p) => sum + p.mnozstvi * p.cena, 0);
    const castka = Number.isNaN(parseInt(body.amount)) ? cenaPolozek : parseInt(body.amount);
    const sleva = parseInt(body.sleva) || 0;
    const kZaplaceni = castka - sleva;
    const paymentMethod = body.paymentMethod;

    if (kZaplaceni < 0 || !PAYMENT_METHODS.includes(paymentMethod)) {
        return 'invalid';
    }

    const userId = parseInt(body.userId);
    let kreditStrzen = false;

    try {
        if (paymentMethod === 'credit') {
            if (Number.isNaN(userId)) {
                return 'no_user';
            }
            const novyKredit = await chargeUserCredit(userId, kZaplaceni);
            if (novyKredit === null) {
                return 'negative_credit';
            }
            kreditStrzen = true;
        }

        const rozdil = kZaplaceni - cenaPolozek;
        const poznamka = [paymentMethod, paymentMethod === 'credit' && `userId:${userId}`, note].filter(Boolean).join(', ');

        await Promise.all(polozky.flatMap((p, i) => [
            createMovement(p.nazev, movementType, p.mnozstvi, p.cena, i === 0 ? rozdil : 0, poznamka, authorId),
            updateInventory(p.nazev, 0, -p.mnozstvi),
        ]));

        return 'success';

    } catch (error) {
        console.error('Error processing payment:', error);
        if (kreditStrzen) {
            await updateUserCredit(userId, kZaplaceni).catch(err => console.error('Refunding credit failed:', err));
        }
        return 'processing';
    }
};

module.exports = { recordShopPayment };
