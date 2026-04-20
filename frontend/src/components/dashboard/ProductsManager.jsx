import React, { useState, useEffect } from 'react';
import { productsAPI } from '../../services/api';
import { notificationAPI } from '../../services/notificationApi';
import { useApp } from '../../context/AppContext';
import '../styles/ProductsManager.css';

const ProductsManager = ({ user }) => {
  const { t, theme } = useApp();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    stock: '',
    imageUrl: ''
  });
  const [showForm, setShowForm] = useState(false);
  const [imageError, setImageError] = useState({});

  const categories = [
    { value: 'electronics', label: t('electronics') },
    { value: 'clothing', label: t('clothing') },
    { value: 'books', label: t('books') },
    { value: 'home', label: t('home') },
    { value: 'sports', label: t('sports') },
    { value: 'other', label: t('other') }
  ];

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await productsAPI.getAllProducts();
      setProducts(response.data.products);
    } catch (err) {
      setError(err.response?.data?.error || t('errorLoading'));
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProduct = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const response = await productsAPI.createProduct(formData);
      setProducts([response.data.product, ...products]);
      setFormData({ name: '', description: '', price: '', category: '', stock: '', imageUrl: '' });
      setShowForm(false);
      await notificationAPI.create({ title: t('productCreated'), message: `${t('productCreated')} "${response.data.product.name}"`, type: 'success' });
    } catch (err) {
      setError(err.response?.data?.error || t('errorCreating'));
    }
  };

  const handleUpdateProduct = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const response = await productsAPI.updateProduct(editingProduct.id, formData);
      setProducts(products.map(p => p.id === editingProduct.id ? response.data.product : p));
      setEditingProduct(null);
      setFormData({ name: '', description: '', price: '', category: '', stock: '', imageUrl: '' });
      setShowForm(false);
      await notificationAPI.create({ title: t('productUpdated'), message: `${t('productUpdated')} "${response.data.product.name}"`, type: 'info' });
    } catch (err) {
      setError(err.response?.data?.error || t('errorUpdating'));
    }
  };

  const handleDeleteProduct = async (id) => {
    if (!window.confirm('Вы уверены?')) return;
    try {
      const deletedProduct = products.find(p => p.id === id);
      await productsAPI.deleteProduct(id);
      setProducts(products.filter(p => p.id !== id));
      await notificationAPI.create({ title: t('productDeleted'), message: `${t('productDeleted')} "${deletedProduct?.name}"`, type: 'warning' });
    } catch (err) {
      setError(err.response?.data?.error || t('errorDeleting'));
    }
  };

  const startEdit = (product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description,
      price: product.price,
      category: product.category,
      stock: product.stock,
      imageUrl: product.imageUrl || ''
    });
    setShowForm(true);
  };

  const handleImageError = (productId) => {
    setImageError(prev => ({ ...prev, [productId]: true }));
  };

  const deleteBtnStyle = {
    background: '#e74c3c',
    color: 'white',
    border: 'none',
    padding: '8px 24px',
    borderRadius: '25px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
    transition: 'all 0.3s',
    boxShadow: '0 2px 8px rgba(231, 76, 60, 0.3)'
  };

  const editBtnStyle = {
    background: '#3498db',
    color: 'white',
    border: 'none',
    padding: '8px 24px',
    borderRadius: '25px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
    transition: 'all 0.3s',
    boxShadow: '0 2px 8px rgba(52, 152, 219, 0.3)'
  };

  const createBtnStyle = {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    border: 'none',
    padding: '12px 28px',
    borderRadius: '25px',
    cursor: 'pointer',
    fontSize: '15px',
    fontWeight: '600',
    transition: 'all 0.3s',
    boxShadow: '0 4px 15px rgba(102, 126, 234, 0.3)'
  };

  return (
    <div className={`products-manager ${theme}`}>
      <div className="section-header">
        <h2>🛍️ {t('productsManagement')}</h2>
        <button onClick={() => setShowForm(!showForm)} style={createBtnStyle} onMouseEnter={(e) => { e.target.style.transform = 'translateY(-2px)'; e.target.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.4)'; }} onMouseLeave={(e) => { e.target.style.transform = 'translateY(0)'; e.target.style.boxShadow = '0 4px 15px rgba(102, 126, 234, 0.3)'; }}>
          {showForm ? t('cancel') : `+ ${t('addProduct')}`}
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      {showForm && (
        <form onSubmit={editingProduct ? handleUpdateProduct : handleCreateProduct} className={`product-form ${theme}`}>
          <h3>{editingProduct ? t('editProduct') : t('addProduct')}</h3>
          <input type="text" placeholder={t('productName')} value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
          <textarea placeholder={t('description')} value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} required rows="3" />
          <div className="form-row">
            <input type="number" placeholder={t('price')} value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })} required step="0.01" />
            <input type="number" placeholder={t('stock')} value={formData.stock} onChange={(e) => setFormData({ ...formData, stock: e.target.value })} />
          </div>
          <select value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} required>
            <option value="">{t('category')}</option>
            {categories.map(cat => (<option key={cat.value} value={cat.value}>{cat.label}</option>))}
          </select>
          <input type="text" placeholder={t('imageUrl')} value={formData.imageUrl} onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })} />
          <div className="form-actions">
            <button type="submit">{editingProduct ? t('save') : t('create')}</button>
            <button type="button" onClick={() => { setShowForm(false); setEditingProduct(null); setFormData({ name: '', description: '', price: '', category: '', stock: '', imageUrl: '' }); }}>{t('cancel')}</button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="loading">{t('loading')}...</div>
      ) : products.length === 0 ? (
        <div className={`no-items ${theme}`}>{t('noProducts')}</div>
      ) : (
        <div className="products-grid">
          {products.map(product => (
            <div key={product.id} className={`product-card ${theme}`}>
              {product.imageUrl && !imageError[product.id] && <img src={product.imageUrl} alt={product.name} className="product-image" onError={() => handleImageError(product.id)} />}
              {product.imageUrl && imageError[product.id] && <div className="product-image-placeholder">🖼️</div>}
              <div className="product-info">
                <h3>{product.name}</h3>
                <span className="product-category">{categories.find(c => c.value === product.category)?.label || product.category}</span>
                <p className="product-description">{product.description}</p>
                <div className="product-footer">
                  <span className="product-price">💰 {product.price} ₽</span>
                  <span className="product-stock">📦 {t('inStock')}: {product.stock}</span>
                </div>
                <div className="product-meta">
                  <small>👤 {product.author.username}</small>
                  <small>📅 {new Date(product.createdAt).toLocaleDateString()}</small>
                </div>
                {product.authorId === user?.id && (
                  <div className="product-actions">
                    <button onClick={() => startEdit(product)} style={editBtnStyle} onMouseEnter={(e) => { e.target.style.background = '#2980b9'; e.target.style.transform = 'translateY(-2px)'; }} onMouseLeave={(e) => { e.target.style.background = '#3498db'; e.target.style.transform = 'translateY(0)'; }}>{t('edit')}</button>
                    <button onClick={() => handleDeleteProduct(product.id)} style={deleteBtnStyle} onMouseEnter={(e) => { e.target.style.background = '#c0392b'; e.target.style.transform = 'translateY(-2px)'; }} onMouseLeave={(e) => { e.target.style.background = '#e74c3c'; e.target.style.transform = 'translateY(0)'; }}>{t('delete')}</button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProductsManager;