<script lang="ts">
/**
 * T12-001: Customer Feedback Collection Interface
 *
 * Interface for collecting and analyzing customer feedback during soft launch
 * Real-time integration for system refinements and improvements
 */

import { onMount } from 'svelte';
import { writable } from 'svelte/store';

interface FeedbackItem {
  id: string;
  customerId: string;
  type: 'onboarding' | 'booking' | 'payment' | 'support' | 'general';
  rating: number;
  comment: string;
  category: 'ux' | 'performance' | 'features' | 'bugs' | 'suggestions';
  priority: 'low' | 'medium' | 'high' | 'critical';
  actionTaken?: string;
  resolvedAt?: Date;
  createdAt: Date;
}

interface FeedbackAnalysis {
  totalFeedback: number;
  averageRating: number;
  categoryBreakdown: Record<string, number>;
  priorityBreakdown: Record<string, number>;
  improvementAreas: string[];
  satisfactionTrend: number[];
}

// Reactive stores
const feedbackData = writable<FeedbackItem[]>([]);
const analysis = writable<FeedbackAnalysis | null>(null);
const isLoading = writable(false);

// Form state
let selectedType: FeedbackItem['type'] = 'general';
let selectedRating = 5;
let comment = '';
let customerName = '';
let customerEmail = '';

onMount(() => {
  loadFeedbackData();
});

async function loadFeedbackData() {
  isLoading.set(true);
  try {
    // In a real implementation, this would fetch from the API
    // For demo purposes, we'll generate sample data
    const sampleFeedback = generateSampleFeedback();
    feedbackData.set(sampleFeedback);

    const analysisData = analyzeeFeedback(sampleFeedback);
    analysis.set(analysisData);
  } catch (error) {
    console.error('Error loading feedback:', error);
  } finally {
    isLoading.set(false);
  }
}

async function submitFeedback() {
  if (!comment.trim() || !customerName.trim()) {
    alert('Por favor complete todos los campos requeridos');
    return;
  }

  const newFeedback: FeedbackItem = {
    id: `feedback_${Date.now()}`,
    customerId: `customer_${Math.floor(Math.random() * 1000)}`,
    type: selectedType,
    rating: selectedRating,
    comment: comment.trim(),
    category: categorizeFeedback(comment),
    priority: prioritizeFeedback(selectedRating),
    createdAt: new Date()
  };

  try {
    // Add to current feedback
    feedbackData.update(items => [newFeedback, ...items]);

    // Reset form
    selectedType = 'general';
    selectedRating = 5;
    comment = '';
    customerName = '';
    customerEmail = '';

    alert('¡Gracias por tu feedback! Será revisado por nuestro equipo.');

    // Refresh analysis
    const currentData = await new Promise(resolve => {
      feedbackData.subscribe(data => resolve(data))();
    });
    const newAnalysis = analyzeeFeedback(currentData as FeedbackItem[]);
    analysis.set(newAnalysis);

  } catch (error) {
    console.error('Error submitting feedback:', error);
    alert('Error al enviar feedback. Por favor intente nuevamente.');
  }
}

function generateSampleFeedback(): FeedbackItem[] {
  const types: FeedbackItem['type'][] = ['onboarding', 'booking', 'payment', 'support', 'general'];
  const comments = [
    'El proceso de registro fue muy intuitivo, me gustó mucho la interfaz.',
    'Tuve algunos problemas con la verificación de mi cuenta, tardó más de lo esperado.',
    'Excelente integración con MercadoPago, muy seguro y fácil de usar.',
    'La funcionalidad de reserva de turnos es fantástica, muy práctica.',
    'El soporte al cliente respondió rápido pero la solución no fue completa.',
    'Me encanta poder ver la disponibilidad en tiempo real.',
    'Faltaría una opción para cancelar turnos con más facilidad.',
    'La aplicación es muy rápida, funciona perfecto en mi celular.',
    'Sería bueno tener notificaciones por WhatsApp.',
    'La interfaz está muy bien diseñada, muy profesional.'
  ];

  return Array.from({ length: 25 }, (_, i) => ({
    id: `feedback_${i + 1}`,
    customerId: `customer_${i + 1}`,
    type: types[Math.floor(Math.random() * types.length)],
    rating: Math.floor(Math.random() * 3) + 3, // 3-5 stars
    comment: comments[Math.floor(Math.random() * comments.length)],
    category: ['ux', 'performance', 'features', 'bugs', 'suggestions'][Math.floor(Math.random() * 5)] as any,
    priority: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)] as any,
    createdAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000) // Last 7 days
  }));
}

function analyzeeFeedback(feedback: FeedbackItem[]): FeedbackAnalysis {
  const totalFeedback = feedback.length;
  const averageRating = feedback.reduce((sum, item) => sum + item.rating, 0) / totalFeedback;

  const categoryBreakdown: Record<string, number> = {};
  const priorityBreakdown: Record<string, number> = {};

  feedback.forEach(item => {
    categoryBreakdown[item.category] = (categoryBreakdown[item.category] || 0) + 1;
    priorityBreakdown[item.priority] = (priorityBreakdown[item.priority] || 0) + 1;
  });

  const improvementAreas = Object.entries(categoryBreakdown)
    .filter(([category, count]) => count > totalFeedback * 0.15) // More than 15% of feedback
    .map(([category]) => category)
    .slice(0, 3);

  // Generate satisfaction trend (last 7 days)
  const satisfactionTrend = Array.from({ length: 7 }, (_, i) => {
    const dayStart = new Date();
    dayStart.setDate(dayStart.getDate() - (6 - i));
    dayStart.setHours(0, 0, 0, 0);

    const dayEnd = new Date(dayStart);
    dayEnd.setHours(23, 59, 59, 999);

    const dayFeedback = feedback.filter(item =>
      item.createdAt >= dayStart && item.createdAt <= dayEnd
    );

    return dayFeedback.length > 0
      ? dayFeedback.reduce((sum, item) => sum + item.rating, 0) / dayFeedback.length
      : 0;
  });

  return {
    totalFeedback,
    averageRating,
    categoryBreakdown,
    priorityBreakdown,
    improvementAreas,
    satisfactionTrend
  };
}

function categorizeFeedback(comment: string): FeedbackItem['category'] {
  const lowerComment = comment.toLowerCase();

  if (lowerComment.includes('lento') || lowerComment.includes('rápido') || lowerComment.includes('rendimiento')) {
    return 'performance';
  }
  if (lowerComment.includes('error') || lowerComment.includes('problema') || lowerComment.includes('falla')) {
    return 'bugs';
  }
  if (lowerComment.includes('falta') || lowerComment.includes('agregar') || lowerComment.includes('sería bueno')) {
    return 'suggestions';
  }
  if (lowerComment.includes('interfaz') || lowerComment.includes('diseño') || lowerComment.includes('fácil')) {
    return 'ux';
  }
  return 'features';
}

function prioritizeFeedback(rating: number): FeedbackItem['priority'] {
  if (rating <= 2) return 'critical';
  if (rating <= 3) return 'high';
  if (rating <= 4) return 'medium';
  return 'low';
}

function getRatingColor(rating: number): string {
  if (rating >= 4.5) return 'text-green-600';
  if (rating >= 4.0) return 'text-yellow-600';
  if (rating >= 3.0) return 'text-orange-600';
  return 'text-red-600';
}

function getPriorityColor(priority: string): string {
  switch (priority) {
    case 'critical': return 'bg-red-100 text-red-800 border-red-200';
    case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
    case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    default: return 'bg-gray-100 text-gray-800 border-gray-200';
  }
}

function getCategoryEmoji(category: string): string {
  switch (category) {
    case 'ux': return '🎨';
    case 'performance': return '⚡';
    case 'features': return '🔧';
    case 'bugs': return '🐛';
    case 'suggestions': return '💡';
    default: return '📝';
  }
}
</script>

<div class="feedback-interface p-6 bg-gradient-to-br from-purple-50 to-pink-100 min-h-screen">
  <div class="max-w-6xl mx-auto">
    <!-- Header -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-gray-900 mb-2">
        💬 Customer Feedback Collection
      </h1>
      <p class="text-lg text-gray-600">
        Real-time feedback integration for T12-001 soft launch optimization
      </p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <!-- Feedback Form -->
      <div class="lg:col-span-1">
        <div class="bg-white rounded-xl shadow-md p-6 border border-gray-200">
          <h2 class="text-xl font-semibold text-gray-900 mb-6">Enviar Feedback</h2>

          <form on:submit|preventDefault={submitFeedback} class="space-y-4">
            <!-- Customer Info -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Nombre *
              </label>
              <input
                type="text"
                bind:value={customerName}
                required
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                placeholder="Tu nombre"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Email (opcional)
              </label>
              <input
                type="email"
                bind:value={customerEmail}
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                placeholder="tu@email.com"
              />
            </div>

            <!-- Feedback Type -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Tipo de Feedback
              </label>
              <select
                bind:value={selectedType}
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              >
                <option value="onboarding">Registro/Onboarding</option>
                <option value="booking">Sistema de Reservas</option>
                <option value="payment">Pagos</option>
                <option value="support">Soporte al Cliente</option>
                <option value="general">General</option>
              </select>
            </div>

            <!-- Rating -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Calificación
              </label>
              <div class="flex gap-1">
                {#each Array(5) as _, i}
                  <button
                    type="button"
                    on:click={() => selectedRating = i + 1}
                    class="text-2xl transition-colors hover:text-yellow-400 {i < selectedRating ? 'text-yellow-400' : 'text-gray-300'}"
                  >
                    ⭐
                  </button>
                {/each}
                <span class="ml-2 text-sm text-gray-600">
                  ({selectedRating}/5)
                </span>
              </div>
            </div>

            <!-- Comment -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Comentario *
              </label>
              <textarea
                bind:value={comment}
                required
                rows="4"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 resize-none"
                placeholder="Comparte tu experiencia, sugerencias o problemas..."
              ></textarea>
            </div>

            <button
              type="submit"
              class="w-full py-2 px-4 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
            >
              Enviar Feedback
            </button>
          </form>
        </div>
      </div>

      <!-- Analysis & Recent Feedback -->
      <div class="lg:col-span-2">
        {#if $isLoading}
          <div class="flex items-center justify-center py-12">
            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
            <span class="ml-3 text-gray-600">Cargando feedback...</span>
          </div>
        {:else if $analysis}
          <!-- Analysis Overview -->
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div class="bg-white rounded-xl shadow-md p-6 border border-gray-200 text-center">
              <div class="text-3xl font-bold text-purple-600">
                {$analysis.totalFeedback}
              </div>
              <div class="text-sm text-gray-600 mt-1">Total Feedback</div>
            </div>

            <div class="bg-white rounded-xl shadow-md p-6 border border-gray-200 text-center">
              <div class="text-3xl font-bold {getRatingColor($analysis.averageRating)}">
                {$analysis.averageRating.toFixed(1)}
              </div>
              <div class="text-sm text-gray-600 mt-1">Calificación Promedio</div>
            </div>

            <div class="bg-white rounded-xl shadow-md p-6 border border-gray-200 text-center">
              <div class="text-3xl font-bold text-green-600">
                {Math.round(($analysis.averageRating / 5) * 100)}%
              </div>
              <div class="text-sm text-gray-600 mt-1">Satisfacción</div>
            </div>
          </div>

          <!-- Category Breakdown -->
          <div class="bg-white rounded-xl shadow-md p-6 border border-gray-200 mb-8">
            <h3 class="text-xl font-semibold text-gray-900 mb-4">
              📊 Análisis por Categoría
            </h3>
            <div class="grid grid-cols-2 md:grid-cols-5 gap-4">
              {#each Object.entries($analysis.categoryBreakdown) as [category, count]}
                <div class="text-center p-3 bg-gray-50 rounded-lg">
                  <div class="text-2xl mb-2">
                    {getCategoryEmoji(category)}
                  </div>
                  <div class="text-lg font-semibold text-gray-900">
                    {count}
                  </div>
                  <div class="text-sm text-gray-600 capitalize">
                    {category}
                  </div>
                </div>
              {/each}
            </div>
          </div>

          <!-- Priority Breakdown -->
          <div class="bg-white rounded-xl shadow-md p-6 border border-gray-200 mb-8">
            <h3 class="text-xl font-semibold text-gray-900 mb-4">
              🎯 Análisis por Prioridad
            </h3>
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
              {#each Object.entries($analysis.priorityBreakdown) as [priority, count]}
                <div class="p-3 rounded-lg border-2 {getPriorityColor(priority)}">
                  <div class="text-lg font-semibold">
                    {count}
                  </div>
                  <div class="text-sm capitalize">
                    {priority}
                  </div>
                </div>
              {/each}
            </div>
          </div>

          <!-- Recent Feedback -->
          <div class="bg-white rounded-xl shadow-md p-6 border border-gray-200">
            <h3 class="text-xl font-semibold text-gray-900 mb-4">
              📝 Feedback Reciente
            </h3>
            <div class="space-y-4 max-h-96 overflow-y-auto">
              {#each $feedbackData.slice(0, 10) as item}
                <div class="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div class="flex items-start justify-between mb-2">
                    <div class="flex items-center gap-2">
                      <span class="text-lg">
                        {getCategoryEmoji(item.category)}
                      </span>
                      <span class="font-medium text-gray-900 capitalize">
                        {item.type}
                      </span>
                      <span class="px-2 py-1 rounded-full text-xs border {getPriorityColor(item.priority)}">
                        {item.priority}
                      </span>
                    </div>
                    <div class="flex items-center gap-2">
                      <div class="flex">
                        {#each Array(5) as _, i}
                          <span class="text-sm {i < item.rating ? 'text-yellow-400' : 'text-gray-300'}">
                            ⭐
                          </span>
                        {/each}
                      </div>
                      <span class="text-xs text-gray-500">
                        {item.createdAt.toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <p class="text-gray-700 text-sm leading-relaxed">
                    {item.comment}
                  </p>
                </div>
              {/each}
            </div>
          </div>
        {/if}
      </div>
    </div>
  </div>
</div>

<style>
.feedback-interface {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

/* Custom scrollbar */
.overflow-y-auto::-webkit-scrollbar {
  width: 6px;
}

.overflow-y-auto::-webkit-scrollbar-track {
  background: #f1f5f9;
  border-radius: 3px;
}

.overflow-y-auto::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 3px;
}

.overflow-y-auto::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .feedback-interface {
    padding: 1rem;
  }

  .text-3xl {
    font-size: 1.875rem;
  }

  .grid-cols-2 {
    grid-template-columns: repeat(1, minmax(0, 1fr));
  }
}
</style>