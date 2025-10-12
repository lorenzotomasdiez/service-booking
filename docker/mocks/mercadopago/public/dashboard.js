// Dashboard.js - Client-side logic for MercadoPago Mock Dashboard

// State
let currentScenario = 'loading';
let transactions = [];
let isLoading = false;

// API Base URL
const API_BASE = '/api/dashboard';

// DOM Elements
const elements = {
  currentScenario: document.getElementById('current-scenario'),
  scenarioSelect: document.getElementById('scenario-select'),
  changeScenarioBtn: document.getElementById('change-scenario-btn'),
  scenarioMessage: document.getElementById('scenario-message'),
  transactionCount: document.getElementById('count'),
  transactionTbody: document.getElementById('transaction-tbody'),
  clearHistoryBtn: document.getElementById('clear-history-btn'),
  paymentIdInput: document.getElementById('payment-id-input'),
  triggerWebhookBtn: document.getElementById('trigger-webhook-btn'),
  webhookMessage: document.getElementById('webhook-message'),
  confirmModal: document.getElementById('confirm-modal'),
  confirmMessage: document.getElementById('confirm-message'),
  confirmYes: document.getElementById('confirm-yes'),
  confirmNo: document.getElementById('confirm-no'),
};

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  initEventListeners();
  loadCurrentScenario();
  loadTransactions();

  // Auto-refresh transactions every 10 seconds
  setInterval(loadTransactions, 10000);
});

// Event Listeners
function initEventListeners() {
  elements.changeScenarioBtn.addEventListener('click', handleChangeScenario);
  elements.clearHistoryBtn.addEventListener('click', handleClearHistory);
  elements.triggerWebhookBtn.addEventListener('click', handleTriggerWebhook);
  elements.confirmNo.addEventListener('click', closeModal);
}

// Load Current Scenario
async function loadCurrentScenario() {
  try {
    const response = await fetch(`${API_BASE}/scenario`);

    if (!response.ok) {
      throw new Error('Failed to fetch scenario');
    }

    const data = await response.json();
    currentScenario = data.scenario || 'success';

    updateScenarioUI(currentScenario);
  } catch (error) {
    console.error('Error loading scenario:', error);
    showMessage(elements.scenarioMessage, 'Error al cargar el escenario actual', 'error');
    elements.currentScenario.textContent = 'Error';
  }
}

// Update Scenario UI
function updateScenarioUI(scenario) {
  elements.currentScenario.textContent = getScenarioLabel(scenario);
  elements.scenarioSelect.value = scenario;
}

// Get Scenario Label
function getScenarioLabel(scenario) {
  const labels = {
    success: '✅ Éxito',
    pending: '⏳ Pendiente',
    rejected: '❌ Rechazado',
    timeout: '⏰ Timeout',
  };
  return labels[scenario] || scenario;
}

// Handle Change Scenario
async function handleChangeScenario() {
  const newScenario = elements.scenarioSelect.value;

  if (newScenario === currentScenario) {
    showMessage(elements.scenarioMessage, 'El escenario ya está activo', 'info');
    return;
  }

  setLoading(elements.changeScenarioBtn, true);

  try {
    const response = await fetch(`${API_BASE}/scenario`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ scenario: newScenario }),
    });

    if (!response.ok) {
      throw new Error('Failed to change scenario');
    }

    const data = await response.json();
    currentScenario = data.scenario;

    updateScenarioUI(currentScenario);
    showMessage(elements.scenarioMessage, `Escenario cambiado a: ${getScenarioLabel(currentScenario)}`, 'success');
  } catch (error) {
    console.error('Error changing scenario:', error);
    showMessage(elements.scenarioMessage, 'Error al cambiar el escenario', 'error');
  } finally {
    setLoading(elements.changeScenarioBtn, false);
  }
}

// Load Transactions
async function loadTransactions() {
  try {
    const response = await fetch(`${API_BASE}/transactions`);

    if (!response.ok) {
      throw new Error('Failed to fetch transactions');
    }

    const data = await response.json();
    transactions = data.transactions || [];

    updateTransactionsUI();
  } catch (error) {
    console.error('Error loading transactions:', error);
    // Silently fail for auto-refresh, only show error on initial load
    if (transactions.length === 0) {
      elements.transactionTbody.innerHTML = `
        <tr class="empty-state">
          <td colspan="6">Error al cargar transacciones</td>
        </tr>
      `;
    }
  }
}

// Update Transactions UI
function updateTransactionsUI() {
  elements.transactionCount.textContent = transactions.length;

  if (transactions.length === 0) {
    elements.transactionTbody.innerHTML = `
      <tr class="empty-state">
        <td colspan="6">No hay transacciones registradas</td>
      </tr>
    `;
    return;
  }

  // Sort by timestamp (most recent first)
  const sortedTransactions = [...transactions].sort((a, b) => {
    return new Date(b.timestamp) - new Date(a.timestamp);
  });

  // Limit to 50 transactions
  const displayTransactions = sortedTransactions.slice(0, 50);

  elements.transactionTbody.innerHTML = displayTransactions
    .map(transaction => createTransactionRow(transaction))
    .join('');

  // Add event listeners to webhook buttons
  displayTransactions.forEach((transaction, index) => {
    const webhookBtn = document.getElementById(`webhook-btn-${index}`);
    if (webhookBtn) {
      webhookBtn.addEventListener('click', () => triggerWebhookForPayment(transaction.id));
    }
  });
}

// Create Transaction Row
function createTransactionRow(transaction, index) {
  const statusClass = getStatusClass(transaction.status);
  const amount = formatCurrency(transaction.amount);
  const timestamp = formatTimestamp(transaction.timestamp);
  const method = transaction.paymentMethod || 'N/A';

  return `
    <tr>
      <td><code>${transaction.id}</code></td>
      <td>${amount}</td>
      <td><span class="status-badge ${statusClass}">${transaction.status}</span></td>
      <td>${method}</td>
      <td>${timestamp}</td>
      <td>
        <button id="webhook-btn-${index}" class="btn btn-secondary btn-sm btn-table">
          Webhook
        </button>
      </td>
    </tr>
  `;
}

// Get Status Class
function getStatusClass(status) {
  const statusMap = {
    approved: 'approved',
    pending: 'pending',
    rejected: 'rejected',
  };
  return statusMap[status] || 'pending';
}

// Format Currency
function formatCurrency(amount) {
  if (typeof amount === 'number') {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
    }).format(amount);
  }
  return amount || 'N/A';
}

// Format Timestamp
function formatTimestamp(timestamp) {
  if (!timestamp) return 'N/A';

  const date = new Date(timestamp);
  return new Intl.DateTimeFormat('es-AR', {
    dateStyle: 'short',
    timeStyle: 'medium',
  }).format(date);
}

// Handle Clear History
function handleClearHistory() {
  showConfirmModal(
    '¿Está seguro de que desea eliminar todo el historial de transacciones?',
    async () => {
      setLoading(elements.clearHistoryBtn, true);

      try {
        const response = await fetch(`${API_BASE}/transactions`, {
          method: 'DELETE',
        });

        if (!response.ok) {
          throw new Error('Failed to clear transactions');
        }

        transactions = [];
        updateTransactionsUI();
        showMessage(elements.scenarioMessage, 'Historial de transacciones eliminado', 'success');
      } catch (error) {
        console.error('Error clearing transactions:', error);
        showMessage(elements.scenarioMessage, 'Error al eliminar el historial', 'error');
      } finally {
        setLoading(elements.clearHistoryBtn, false);
      }
    }
  );
}

// Handle Trigger Webhook
async function handleTriggerWebhook() {
  const paymentId = elements.paymentIdInput.value.trim();

  if (!paymentId) {
    showMessage(elements.webhookMessage, 'Por favor ingrese un Payment ID', 'error');
    return;
  }

  await triggerWebhookForPayment(paymentId);
}

// Trigger Webhook for Payment
async function triggerWebhookForPayment(paymentId) {
  setLoading(elements.triggerWebhookBtn, true);

  try {
    const response = await fetch(`${API_BASE}/webhook/${paymentId}`, {
      method: 'POST',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to trigger webhook');
    }

    const data = await response.json();
    showMessage(elements.webhookMessage, `Webhook enviado exitosamente para payment ID: ${paymentId}`, 'success');
    elements.paymentIdInput.value = '';
  } catch (error) {
    console.error('Error triggering webhook:', error);
    showMessage(elements.webhookMessage, `Error: ${error.message}`, 'error');
  } finally {
    setLoading(elements.triggerWebhookBtn, false);
  }
}

// Show Message
function showMessage(element, message, type = 'info') {
  element.textContent = message;
  element.className = `message ${type}`;
  element.style.display = 'block';

  // Auto-hide after 5 seconds
  setTimeout(() => {
    element.style.display = 'none';
  }, 5000);
}

// Show Confirmation Modal
function showConfirmModal(message, onConfirm) {
  elements.confirmMessage.textContent = message;
  elements.confirmModal.style.display = 'flex';

  // Remove previous listeners
  const newConfirmYes = elements.confirmYes.cloneNode(true);
  elements.confirmYes.parentNode.replaceChild(newConfirmYes, elements.confirmYes);
  elements.confirmYes = newConfirmYes;

  elements.confirmYes.addEventListener('click', () => {
    closeModal();
    onConfirm();
  });
}

// Close Modal
function closeModal() {
  elements.confirmModal.style.display = 'none';
}

// Set Loading State
function setLoading(button, loading) {
  if (loading) {
    button.disabled = true;
    button.dataset.originalText = button.textContent;
    button.innerHTML = '<span class="loading"></span>';
  } else {
    button.disabled = false;
    button.textContent = button.dataset.originalText || button.textContent;
  }
}

// Error Handling for Fetch
window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
});
