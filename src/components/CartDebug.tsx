import { useCart } from '../context/CartContext';

export const CartDebug = () => {
    const cart = useCart();

    return (
        <div style={{
            position: 'fixed',
            bottom: '10px',
            right: '10px',
            background: 'black',
            color: 'white',
            padding: '10px',
            borderRadius: '5px',
            fontSize: '12px',
            zIndex: 9999,
            maxWidth: '300px'
        }}>
            <div><strong>Cart Debug:</strong></div>
            <div>Items: {cart.items.length}</div>
            <div>Count: {cart.itemCount}</div>
            <div>Total: ₹{cart.total}</div>
            <div>Loading: {cart.loading ? 'Yes' : 'No'}</div>
            <div style={{ marginTop: '5px', fontSize: '10px' }}>
                LocalStorage: {localStorage.getItem('swati_jewellers_cart')?.substring(0, 50)}...
            </div>
        </div>
    );
};
