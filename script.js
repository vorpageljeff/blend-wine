const products = [
  { id: 1, name: 'Seleção Malbec', brand: 'Curadoria Blend', category: 'tinto', occasion: 'jantar', price: 89.9, badge: 'Para harmonizar', label: 'Malbec', tone: '#6f2638', options: ['Argentina', 'Tinto seco'] },
  { id: 2, name: 'Espumante Brut 130', brand: 'Casa Valduga', category: 'espumante', occasion: 'celebrar', price: 149.9, badge: 'Celebração', label: 'Brut 130', tone: '#8d8d52', options: ['Brasil', 'Brut'] },
  { id: 3, name: 'Espumante Brut Rosé 130', brand: 'Casa Valduga', category: 'espumante', occasion: 'celebrar', price: 168.9, badge: 'Destaque', label: 'Rosé 130', tone: '#bf6f6b', options: ['Brasil', 'Brut rosé'], className: 'rose' },
  { id: 4, name: 'Sauvignon Blanc Reserva', brand: 'Seleção da casa', category: 'branco', occasion: 'jantar', price: 79.9, badge: 'Leve e fresco', label: 'Reserva', tone: '#a7a269', options: ['Chile', 'Branco seco'] },
  { id: 5, name: 'Kit Celebração', brand: 'Blend Wine', category: 'kit', occasion: 'presente', price: 219.9, badge: 'Para presentear', label: 'Blend', tone: '#666735', options: ['2 rótulos', 'Embalagem especial'], className: 'gift' },
  { id: 6, name: 'Prosecco Extra Dry', brand: 'Seleção da casa', category: 'espumante', occasion: 'presente', price: 109.9, badge: 'Versátil', label: 'Prosecco', tone: '#6b7953', options: ['Itália', 'Extra dry'], className: 'sparkle' }
];

const state = { category: 'all', occasion: 'all', search: '', order: 'featured', cart: new Map() };
const money = value => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

function filteredProducts() {
  let rows = products.filter(product => state.category === 'all' || product.category === state.category);
  rows = rows.filter(product => state.occasion === 'all' || product.occasion === state.occasion);
  rows = rows.filter(product => `${product.name} ${product.brand} ${product.options.join(' ')}`.toLowerCase().includes(state.search));
  if (state.order === 'low') rows.sort((a, b) => a.price - b.price);
  if (state.order === 'high') rows.sort((a, b) => b.price - a.price);
  return rows;
}

function renderProducts() {
  const rows = filteredProducts();
  document.querySelector('#result-count').textContent = rows.length;
  document.querySelector('#products').innerHTML = rows.map(product => `
    <article class="product">
      <div class="product-visual" style="--accent:${product.tone}"><span class="badge">${product.badge}</span><div class="bottle ${product.className || ''}" data-label="${product.label}"></div></div>
      <div class="product-copy"><span class="product-brand">${product.brand}</span><h3>${product.name}</h3><div class="product-options">${product.options.map(option => `<span>${option}</span>`).join('')}</div><div class="product-bottom"><div class="product-price"><small>valor ilustrativo</small><strong>${money(product.price)}</strong></div><button class="add" data-id="${product.id}">Adicionar</button></div></div>
    </article>`).join('');
  document.querySelectorAll('.add').forEach(button => button.addEventListener('click', () => addProduct(Number(button.dataset.id))));
}

function addProduct(id) {
  state.cart.set(id, (state.cart.get(id) || 0) + 1);
  renderOrder();
  document.querySelector('#pedido').scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function cartRows() { return [...state.cart].map(([id, quantity]) => ({ product: products.find(product => product.id === id), quantity })); }

function renderOrder() {
  const rows = cartRows();
  const count = rows.reduce((sum, row) => sum + row.quantity, 0);
  document.querySelector('#header-count').textContent = count;
  document.querySelector('#order-title').textContent = count ? `${count} ${count === 1 ? 'item selecionado' : 'itens selecionados'}` : 'Nenhum item selecionado';
  document.querySelector('#order-items').innerHTML = rows.length ? rows.map(({ product, quantity }) => `<div class="order-line"><span>${quantity}× ${product.name}<small> · ${product.options[0]}</small></span><span><strong>${money(product.price * quantity)}</strong> <button data-remove="${product.id}" aria-label="Remover um item">−</button></span></div>`).join('') : '<p class="empty">Escolha um rótulo no catálogo para montar seu pedido.</p>';
  document.querySelector('#total').textContent = money(rows.reduce((sum, row) => sum + row.product.price * row.quantity, 0));
  document.querySelectorAll('[data-remove]').forEach(button => button.addEventListener('click', () => removeProduct(Number(button.dataset.remove))));
}

function removeProduct(id) {
  const quantity = state.cart.get(id) || 0;
  if (quantity <= 1) state.cart.delete(id); else state.cart.set(id, quantity - 1);
  renderOrder();
}

document.querySelector('#search').addEventListener('input', event => { state.search = event.target.value.trim().toLowerCase(); renderProducts(); });
document.querySelector('#category').addEventListener('change', event => { state.category = event.target.value; syncQuickFilters(); renderProducts(); });
document.querySelector('#occasion').addEventListener('change', event => { state.occasion = event.target.value; renderProducts(); });
document.querySelector('#order').addEventListener('change', event => { state.order = event.target.value; renderProducts(); });
document.querySelectorAll('[data-quick]').forEach(button => button.addEventListener('click', () => { state.category = button.dataset.quick; document.querySelector('#category').value = state.category; syncQuickFilters(); renderProducts(); }));
function syncQuickFilters() { document.querySelectorAll('[data-quick]').forEach(button => button.classList.toggle('active', button.dataset.quick === state.category)); }
document.querySelector('#clear-order').addEventListener('click', () => { state.cart.clear(); renderOrder(); });
document.querySelectorAll('[name=delivery]').forEach(input => input.addEventListener('change', () => { document.querySelector('#address').disabled = document.querySelector('[name=delivery]:checked').value !== 'Entrega'; }));
document.querySelector('#whatsapp').addEventListener('click', () => {
  const rows = cartRows();
  const delivery = document.querySelector('[name=delivery]:checked').value;
  const address = document.querySelector('#address').value.trim();
  const notes = document.querySelector('#notes').value.trim();
  const total = rows.reduce((sum, row) => sum + row.product.price * row.quantity, 0);
  const message = rows.length ? `Olá, equipe Blend Wine! Montei este pedido no catálogo:\n\n${rows.map(({ product, quantity }) => `• ${quantity}× ${product.name} — ${money(product.price * quantity)}`).join('\n')}\n\nPreferência: ${delivery}${address ? `\nEndereço: ${address}` : ''}${notes ? `\nObservação: ${notes}` : ''}\nTotal estimado: ${money(total)}\n\nPodem confirmar a disponibilidade, o valor final e as formas de pagamento?` : 'Escolha ao menos um produto para gerar a mensagem.';
  document.querySelector('#message-preview').textContent = message;
  document.querySelector('#preview').showModal();
});
document.querySelectorAll('.close,.close-action').forEach(button => button.addEventListener('click', () => document.querySelector('#preview').close()));

renderProducts();
renderOrder();

if (new URLSearchParams(window.location.search).get('demo') === 'video') {
  state.cart.set(2, 2);
  state.cart.set(1, 1);
  document.querySelector('#notes').value = 'É para presente.';
  renderOrder();
}
