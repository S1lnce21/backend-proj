import React, { useState, useEffect } from 'react';
import { productsAPI } from '../services/api';
import { notificationAPI } from '../services/notificationApi';
import './styles/ProductsManager.css';

const ProductsManager = ({ user }) => {
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

  const categories = ['Электроника', 'Одежда', 'Книги', 'Дом и сад', 'Спорт', 'Другое'];

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
      setError(err.response?.data?.error || 'Ошибка при загрузке товаров');
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
      await notificationAPI.create({ title: 'Новый товар', message: `Товар "${response.data.product.name}" добавлен`, type: 'success' });
    } catch (err) {
      setError(err.response?.data?.error || 'Ошибка при создании товара');
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
      await notificationAPI.create({ title: 'Товар обновлен', message: `Товар "${response.data.product.name}" обновлен`, type: 'info' });
    } catch (err) {
      setError(err.response?.data?.error || 'Ошибка при обновлении товара');
    }
  };

  const handleDeleteProduct = async (id) => {
    if (!window.confirm('Вы уверены, что хотите удалить этот товар?')) return;
    try {
      const deletedProduct = products.find(p => p.id === id);
      await productsAPI.deleteProduct(id);
      setProducts(products.filter(p => p.id !== id));
      await notificationAPI.create({ title: 'Товар удален', message: `Товар "${deletedProduct?.name}" удален`, type: 'warning' });
    } catch (err) {
      setError(err.response?.data?.error || 'Ошибка при удалении товара');
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
    <div className="products-manager">
      <div className="section-header">
        <h2>🛍️ Товары</h2>
        <button 
          onClick={() => setShowForm(!showForm)} 
          style={createBtnStyle}
          onMouseEnter={(e) => { e.target.style.transform = 'translateY(-2px)'; e.target.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.4)'; }}
          onMouseLeave={(e) => { e.target.style.transform = 'translateY(0)'; e.target.style.boxShadow = '0 4px 15px rgba(102, 126, 234, 0.3)'; }}
        >
          {showForm ? '✖ Отмена' : '+ Добавить товар'}
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      {showForm && (
        <form onSubmit={editingProduct ? handleUpdateProduct : handleCreateProduct} className="product-form">
          <h3>{editingProduct ? 'Редактировать товар' : 'Добавить товар'}</h3>
          <input type="text" placeholder="Название товара" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
          <textarea placeholder="Описание" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} required rows="3" />
          <div className="form-row">
            <input type="number" placeholder="Цена" value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })} required step="0.01" />
            <input type="number" placeholder="Количество" value={formData.stock} onChange={(e) => setFormData({ ...formData, stock: e.target.value })} />
          </div>
          <select value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} required>
            <option value="">Выберите категорию</option>
            {categories.map(cat => (<option key={cat} value={cat}>{cat}</option>))}
          </select>
          <input type="text" placeholder="URL изображения (опционально)" value={formData.imageUrl} onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })} />
          <div className="form-actions">
            <button type="submit">{editingProduct ? 'Обновить' : 'Создать'}</button>
            <button type="button" onClick={() => { setShowForm(false); setEditingProduct(null); setFormData({ name: '', description: '', price: '', category: '', stock: '', imageUrl: '' }); }}>Отмена</button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="loading">Загрузка товаров...</div>
      ) : products.length === 0 ? (
        <div className="no-items">Товаров пока нет. Добавьте первый!</div>
      ) : (
        <div className="products-grid">
          {products.map(product => (
            <div key={product.id} className="product-card">
              {product.imageUrl && <img src={product.imageUrl} alt={product.name} className="product-image" />}
              <div className="product-info">
                <h3>{product.name}</h3>
                <span className="product-category">{product.category}</span>
                <p className="product-description">{product.description}</p>
                <div className="product-footer">
                  <span className="product-price">💰 {product.price} ₽</span>
                  <span className="product-stock">📦 В наличии: {product.stock}</span>
                </div>
                <div className="product-meta">
                  <small>👤 {product.author.username}</small>
                  <small>📅 {new Date(product.createdAt).toLocaleDateString()}</small>
                </div>
                {product.authorId === user?.id && (
                  <div className="product-actions">
                    <button 
                      onClick={() => startEdit(product)} 
                      style={editBtnStyle}
                      onMouseEnter={(e) => { e.target.style.background = '#2980b9'; e.target.style.transform = 'translateY(-2px)'; }}
                      onMouseLeave={(e) => { e.target.style.background = '#3498db'; e.target.style.transform = 'translateY(0)'; }}
                    >
                      Редактировать
                    </button>
                    <button 
                      onClick={() => handleDeleteProduct(product.id)} 
                      style={deleteBtnStyle}
                      onMouseEnter={(e) => { e.target.style.background = '#c0392b'; e.target.style.transform = 'translateY(-2px)'; }}
                      onMouseLeave={(e) => { e.target.style.background = '#e74c3c'; e.target.style.transform = 'translateY(0)'; }}
                    >
                      Удалить
                    </button>
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