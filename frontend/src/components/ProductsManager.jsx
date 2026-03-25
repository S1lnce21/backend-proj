import React, { useState, useEffect } from 'react';
import { productsAPI } from '../services/api';
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
    } catch (err) {
      setError(err.response?.data?.error || 'Ошибка при обновлении товара');
    }
  };

  const handleDeleteProduct = async (id) => {
    if (!window.confirm('Вы уверены, что хотите удалить этот товар?')) return;
    try {
      await productsAPI.deleteProduct(id);
      setProducts(products.filter(p => p.id !== id));
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

  return (
    <div className="products-manager">
      <div className="section-header">
        <h2>🛍️ Товары</h2>
        <button onClick={() => setShowForm(!showForm)} className="create-btn">
          {showForm ? 'Отмена' : '+ Добавить товар'}
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      {showForm && (
        <form onSubmit={editingProduct ? handleUpdateProduct : handleCreateProduct} className="product-form">
          <h3>{editingProduct ? 'Редактировать товар' : 'Добавить товар'}</h3>
          <input
            type="text"
            placeholder="Название товара"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
          <textarea
            placeholder="Описание"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            required
            rows="3"
          />
          <div className="form-row">
            <input
              type="number"
              placeholder="Цена"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              required
              step="0.01"
            />
            <input
              type="number"
              placeholder="Количество"
              value={formData.stock}
              onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
            />
          </div>
          <select
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            required
          >
            <option value="">Выберите категорию</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
          <input
            type="text"
            placeholder="URL изображения (опционально)"
            value={formData.imageUrl}
            onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
          />
          <div className="form-actions">
            <button type="submit">{editingProduct ? 'Обновить' : 'Создать'}</button>
            <button type="button" onClick={() => {
              setShowForm(false);
              setEditingProduct(null);
              setFormData({ name: '', description: '', price: '', category: '', stock: '', imageUrl: '' });
            }}>Отмена</button>
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
                    <button onClick={() => startEdit(product)} className="edit-btn">Редактировать</button>
                    <button onClick={() => handleDeleteProduct(product.id)} className="delete-btn">Удалить</button>
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