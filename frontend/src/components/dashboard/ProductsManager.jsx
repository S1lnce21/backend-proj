import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { productsAPI } from '../../services/api';
import { notificationAPI } from '../../services/notificationApi';
import { useApp } from '../../context/AppContext';
import '../styles/ProductsManager.css';

let socket = null;

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

  const isAdmin = user?.role === 'admin';
  const isModerator = user?.role === 'moderator';
  const canDelete = isAdmin || isModerator;

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
    
    if (!socket) {
      socket = io('http://localhost:3000');
      socket.emit('join-user', user?.id);
      
      socket.on('product_created', (newProduct) => {
        setProducts(prev => [newProduct, ...prev]);
      });
      
      socket.on('product_updated', (updatedProduct) => {
        setProducts(prev => prev.map(p => p.id === updatedProduct.id ? updatedProduct : p));
      });
      
      socket.on('product_deleted', ({ id }) => {
        setProducts(prev => prev.filter(p => p.id !== id));
      });
    }
    
    return () => {
      if (socket) {
        socket.off('product_created');
        socket.off('product_updated');
        socket.off('product_deleted');
      }
    };
  }, [user?.id]);

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
      setEditingProduct(null);
      setFormData({ name: '', description: '', price: '', category: '', stock: '', imageUrl: '' });
      setShowForm(false);
      await notificationAPI.create({ title: t('productUpdated'), message: `${t('productUpdated')} "${response.data.product.name}"`, type: 'info' });
    } catch (err) {
      setError(err.response?.data?.error || t('errorUpdating'));
    }
  };

  const handleDeleteProduct = async (id, authorId) => {
    const canDeleteProduct = canDelete || authorId === user?.id;
    if (!canDeleteProduct) {
      setError('У вас нет прав на удаление этого товара');
      return;
    }
    
    if (!window.confirm('Вы уверены, что хотите удалить этот товар?')) return;
    try {
      const deletedProduct = products.find(p => p.id === id);
      await productsAPI.deleteProduct(id);
      await notificationAPI.create({ title: t('productDeleted'), message: `${t('productDeleted')} "${deletedProduct?.name}"`, type: 'warning' });
    } catch (err) {
      setError(err.response?.data?.error || t('errorDeleting'));
    }
  };

  const startEdit = (product) => {
    if (!canDelete && product.authorId !== user?.id) {
      setError('У вас нет прав на редактирование этого товара');
      return;
    }
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

  return (
    <div className={`products-manager ${theme}`}>
      <div className="section-header">
        <h2>🛍️ {t('productsManagement')}</h2>
        <button onClick={() => setShowForm(!showForm)} className="create-product-btn">
          {showForm ? t('cancel') : `+ ${t('addProduct')}`}
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      {showForm && (
        <form onSubmit={editingProduct ? handleUpdateProduct : handleCreateProduct} className="product-form">
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
        <div className="no-items">{t('noProducts')}</div>
      ) : (
        <div className="products-grid">
          {products.map(product => {
            const canEditDelete = canDelete || product.authorId === user?.id;
            return (
              <div key={product.id} className="product-card">
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
                    <small>
                      👤 {product.author.username}
                      {product.author.role === 'admin' && <span className="role-tag admin-tag">👑 Admin</span>}
                      {product.author.role === 'moderator' && <span className="role-tag moderator-tag">🛡️ Mod</span>}
                    </small>
                    <small>📅 {new Date(product.createdAt).toLocaleDateString()}</small>
                  </div>
                  {canEditDelete && (
                    <div className="product-actions">
                      <button onClick={() => startEdit(product)} className="edit-product-btn">{t('edit')}</button>
                      <button onClick={() => handleDeleteProduct(product.id, product.authorId)} className="delete-product-btn">{t('delete')}</button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ProductsManager;