<script lang="ts">
  // Social Features - Leveraging 4.8/5 satisfaction for engagement
  import { onMount, createEventDispatcher } from 'svelte';
  import { fade, fly, scale } from 'svelte/transition';
  import { authStore } from '$lib/stores/auth';
  import { socketService } from '$lib/services/socket';
  import { uxAnalyticsService } from '$lib/services/ux-analytics';
  import Button from '../Button.svelte';
  import Modal from '../Modal.svelte';
  import LoadingSpinner from '../LoadingSpinner.svelte';
  
  export let userType = 'client'; // client, provider
  export let satisfactionScore = 4.8;
  export let argentinaOptimized = true;
  
  const dispatch = createEventDispatcher();
  
  // Social features state
  let activeTab = 'feed';
  let socialFeed: any[] = [];
  let userReviews: any[] = [];
  let referralData: any = {};
  let socialStats: any = {};
  let isLoading = true;
  
  // Argentina social behavior insights
  let argentinaInsights = {
    whatsappSharing: 0.67, // 67% prefer WhatsApp sharing
    instagramIntegration: 0.55, // 55% connect via Instagram
    familyReferrals: 0.72, // 72% refer family members
    reviewImportance: 0.84, // 84% read reviews before booking
    socialProofImpact: 0.78 // 78% influenced by social proof
  };
  
  // Review/Rating state
  let showReviewModal = false;
  let selectedService: any = null;
  let reviewData = {
    rating: 5,
    comment: '',
    photos: [],
    wouldRecommend: true,
    tags: []
  };
  
  // Sharing state
  let showShareModal = false;
  let shareContent: any = null;
  
  // Available review tags
  const reviewTags = [
    { id: 'professional', name: 'Profesional', emoji: '👨‍💼' },
    { id: 'punctual', name: 'Puntual', emoji: '⏰' },
    { id: 'friendly', name: 'Amigable', emoji: '😊' },
    { id: 'clean', name: 'Limpio', emoji: '✨' },
    { id: 'quality', name: 'Calidad', emoji: '🎆' },
    { id: 'price', name: 'Buen precio', emoji: '💰' },
    { id: 'comfortable', name: 'Cómodo', emoji: '🛋️' },
    { id: 'recommended', name: 'Recomendado', emoji: '👍' }
  ];
  
  onMount(async () => {
    try {
      await Promise.all([
        loadSocialFeed(),
        loadUserReviews(),
        loadReferralData(),
        loadSocialStats()
      ]);
      
      isLoading = false;
      
      // Track social features access
      uxAnalyticsService.trackEvent('social_features_accessed', {
        userType,
        satisfactionScore,
        argentinaOptimized
      });
    } catch (error) {
      console.error('[SocialFeatures] Initialization error:', error);
      isLoading = false;
    }
  });
  
  async function loadSocialFeed() {
    try {
      const response = await fetch('/api/social/feed', {
        headers: {
          'Authorization': `Bearer ${$authStore.token}`,
          'X-Argentina-Social': 'true'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        socialFeed = data.feed || [];
      }
    } catch (error) {
      console.error('[SocialFeatures] Load feed error:', error);
    }
  }
  
  async function loadUserReviews() {
    try {
      const response = await fetch('/api/social/reviews', {
        headers: {
          'Authorization': `Bearer ${$authStore.token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        userReviews = data.reviews || [];
      }
    } catch (error) {
      console.error('[SocialFeatures] Load reviews error:', error);
    }
  }
  
  async function loadReferralData() {
    try {
      const response = await fetch('/api/social/referrals', {
        headers: {
          'Authorization': `Bearer ${$authStore.token}`,
          'X-Argentina-Referrals': 'true'
        }
      });
      
      if (response.ok) {
        referralData = await response.json();
      }
    } catch (error) {
      console.error('[SocialFeatures] Load referrals error:', error);
    }
  }
  
  async function loadSocialStats() {
    try {
      const response = await fetch('/api/social/stats', {
        headers: {
          'Authorization': `Bearer ${$authStore.token}`
        }
      });
      
      if (response.ok) {
        socialStats = await response.json();
      }
    } catch (error) {
      console.error('[SocialFeatures] Load stats error:', error);
    }
  }
  
  function openReviewModal(service: any) {
    selectedService = service;
    showReviewModal = true;
    
    // Reset review data
    reviewData = {
      rating: 5,
      comment: '',
      photos: [],
      wouldRecommend: true,
      tags: []
    };
    
    uxAnalyticsService.trackEvent('review_modal_opened', {
      serviceId: service.id,
      serviceType: service.type
    });
  }
  
  async function submitReview() {
    if (!selectedService || !reviewData.comment.trim()) {
      alert('Por favor completa tu reseña');
      return;
    }
    
    try {
      const response = await fetch('/api/social/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${$authStore.token}`
        },
        body: JSON.stringify({
          serviceId: selectedService.id,
          providerId: selectedService.providerId,
          ...reviewData,
          argentinaOptimized: true
        })
      });
      
      if (response.ok) {
        const newReview = await response.json();
        userReviews = [newReview, ...userReviews];
        
        // Close modal
        showReviewModal = false;
        selectedService = null;
        
        // Track successful review
        uxAnalyticsService.trackEvent('review_submitted', {
          rating: reviewData.rating,
          hasComment: !!reviewData.comment,
          tagCount: reviewData.tags.length,
          wouldRecommend: reviewData.wouldRecommend
        });
        
        alert('¡Gracias por tu reseña!');
      } else {
        const error = await response.json();
        alert(`Error: ${error.message}`);
      }
    } catch (error) {
      console.error('[SocialFeatures] Submit review error:', error);
      alert('Error al enviar la reseña');
    }
  }
  
  function toggleReviewTag(tagId: string) {
    if (reviewData.tags.includes(tagId)) {
      reviewData.tags = reviewData.tags.filter(t => t !== tagId);
    } else {
      reviewData.tags = [...reviewData.tags, tagId];
    }
  }
  
  function openShareModal(content: any) {
    shareContent = content;
    showShareModal = true;
    
    uxAnalyticsService.trackEvent('share_modal_opened', {
      contentType: content.type,
      contentId: content.id
    });
  }
  
  async function shareContent(platform: string) {
    if (!shareContent) return;
    
    const shareUrl = `${window.location.origin}/shared/${shareContent.type}/${shareContent.id}`;
    const shareText = generateShareText(shareContent);
    
    try {
      if (platform === 'whatsapp') {
        // WhatsApp sharing (optimized for Argentina)
        const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareText + ' ' + shareUrl)}`;
        window.open(whatsappUrl, '_blank');
      } else if (platform === 'instagram') {
        // Instagram sharing
        if (navigator.share) {
          await navigator.share({
            title: shareContent.name,
            text: shareText,
            url: shareUrl
          });
        } else {
          await navigator.clipboard.writeText(shareUrl);
          alert('Enlace copiado al portapapeles');
        }
      } else if (platform === 'copy') {
        // Copy link
        await navigator.clipboard.writeText(shareUrl);
        alert('Enlace copiado al portapapeles');
      }
      
      // Track share action
      uxAnalyticsService.trackEvent('content_shared', {
        platform,
        contentType: shareContent.type,
        contentId: shareContent.id
      });
      
      showShareModal = false;
    } catch (error) {
      console.error('[SocialFeatures] Share error:', error);
      alert('Error al compartir');
    }
  }
  
  function generateShareText(content: any): string {
    switch (content.type) {
      case 'review':
        return `¡Excelente experiencia en ${content.providerName}! ${content.rating}/5 estrellas. 🎆`;
      case 'provider':
        return `Te recomiendo ${content.name} - ¡Excelente servicio! 👍`;
      case 'service':
        return `Mirá este servicio: ${content.name} - ¡Muy recomendado!`;
      default:
        return '¡Mirá lo que encontré en BarberPro!';
    }
  }
  
  async function likeContent(feedItem: any) {
    try {
      const response = await fetch(`/api/social/like/${feedItem.id}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${$authStore.token}`
        }
      });
      
      if (response.ok) {
        // Update feed item
        socialFeed = socialFeed.map(item => 
          item.id === feedItem.id 
            ? { ...item, liked: !item.liked, likeCount: item.likeCount + (item.liked ? -1 : 1) }
            : item
        );
        
        uxAnalyticsService.trackEvent('content_liked', {
          contentId: feedItem.id,
          contentType: feedItem.type,
          liked: !feedItem.liked
        });
      }
    } catch (error) {
      console.error('[SocialFeatures] Like error:', error);
    }
  }
  
  function changeTab(newTab: string) {
    activeTab = newTab;
    
    uxAnalyticsService.trackEvent('social_tab_changed', {
      from: activeTab,
      to: newTab
    });
  }
  
  function formatDate(dateString: string): string {
    return new Intl.DateTimeFormat('es-AR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      timeZone: 'America/Argentina/Buenos_Aires'
    }).format(new Date(dateString));
  }
  
  function getStarRating(rating: number): string {
    return '⭐'.repeat(Math.floor(rating)) + (rating % 1 >= 0.5 ? '½' : '');
  }
</script>

<!-- Social Features Component -->
<div class="space-y-6">
  <!-- Header with Satisfaction Score -->
  <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between">
    <div>
      <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-2">
        🎆 Red Social
      </h2>
      <p class="text-gray-600 dark:text-gray-400">
        Comparte experiencias y conecta con la comunidad
      </p>
    </div>
    
    <!-- Social Proof Badge -->
    <div class="mt-4 lg:mt-0">
      <div class="flex items-center space-x-3 bg-yellow-100 dark:bg-yellow-800 px-4 py-2 rounded-full">
        <span class="text-2xl">🏆</span>
        <div>
          <div class="text-yellow-800 dark:text-yellow-200 text-sm font-medium">
            Satisfacción Promedio
          </div>
          <div class="text-yellow-900 dark:text-yellow-100 text-xl font-bold">
            {satisfactionScore}/5 ⭐
          </div>
        </div>
      </div>
    </div>
  </div>
  
  {#if isLoading}
    <!-- Loading State -->
    <div class="flex items-center justify-center h-96" in:fade>
      <div class="text-center">
        <LoadingSpinner size="large" />
        <p class="mt-4 text-gray-600 dark:text-gray-300">Cargando contenido social...</p>
      </div>
    </div>
  {:else}
    <!-- Social Stats Cards -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <div class="flex items-center space-x-3">
          <div class="w-12 h-12 bg-blue-100 dark:bg-blue-800 rounded-lg flex items-center justify-center">
            <svg class="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </div>
          <div>
            <p class="text-gray-600 dark:text-gray-400 text-sm">Me Gusta</p>
            <p class="text-2xl font-bold text-gray-900 dark:text-white">
              {socialStats.totalLikes || 0}
            </p>
          </div>
        </div>
      </div>
      
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <div class="flex items-center space-x-3">
          <div class="w-12 h-12 bg-green-100 dark:bg-green-800 rounded-lg flex items-center justify-center">
            <svg class="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <div>
            <p class="text-gray-600 dark:text-gray-400 text-sm">Reseñas</p>
            <p class="text-2xl font-bold text-gray-900 dark:text-white">
              {socialStats.totalReviews || 0}
            </p>
          </div>
        </div>
      </div>
      
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <div class="flex items-center space-x-3">
          <div class="w-12 h-12 bg-purple-100 dark:bg-purple-800 rounded-lg flex items-center justify-center">
            <svg class="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
            </svg>
          </div>
          <div>
            <p class="text-gray-600 dark:text-gray-400 text-sm">Compartidos</p>
            <p class="text-2xl font-bold text-gray-900 dark:text-white">
              {socialStats.totalShares || 0}
            </p>
          </div>
        </div>
      </div>
      
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <div class="flex items-center space-x-3">
          <div class="w-12 h-12 bg-yellow-100 dark:bg-yellow-800 rounded-lg flex items-center justify-center">
            <svg class="w-6 h-6 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <div>
            <p class="text-gray-600 dark:text-gray-400 text-sm">Referidos</p>
            <p class="text-2xl font-bold text-gray-900 dark:text-white">
              {referralData.totalReferrals || 0}
            </p>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Navigation Tabs -->
    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
      <div class="flex flex-wrap gap-2 mb-6 overflow-x-auto pb-2">
        <button
          class="px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap"
          class:bg-blue-600={activeTab === 'feed'}
          class:text-white={activeTab === 'feed'}
          class:bg-gray-200={activeTab !== 'feed'}
          class:text-gray-700={activeTab !== 'feed'}
          class:dark:bg-gray-700={activeTab !== 'feed'}
          class:dark:text-gray-300={activeTab !== 'feed'}
          on:click={() => changeTab('feed')}
        >
          🎆 Feed Social
        </button>
        
        <button
          class="px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap"
          class:bg-blue-600={activeTab === 'reviews'}
          class:text-white={activeTab === 'reviews'}
          class:bg-gray-200={activeTab !== 'reviews'}
          class:text-gray-700={activeTab !== 'reviews'}
          class:dark:bg-gray-700={activeTab !== 'reviews'}
          class:dark:text-gray-300={activeTab !== 'reviews'}
          on:click={() => changeTab('reviews')}
        >
          ⭐ Mis Reseñas
        </button>
        
        <button
          class="px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap"
          class:bg-blue-600={activeTab === 'referrals'}
          class:text-white={activeTab === 'referrals'}
          class:bg-gray-200={activeTab !== 'referrals'}
          class:text-gray-700={activeTab !== 'referrals'}
          class:dark:bg-gray-700={activeTab !== 'referrals'}
          class:dark:text-gray-300={activeTab !== 'referrals'}
          on:click={() => changeTab('referrals')}
        >
          👥 Referidos
        </button>
      </div>
      
      <!-- Tab Content -->
      <div class="tab-content">
        {#if activeTab === 'feed'}
          <!-- Social Feed -->
          <div class="space-y-6" in:fade={{ duration: 200 }}>
            {#if socialFeed.length > 0}
              {#each socialFeed as feedItem (feedItem.id)}
                <div class="border border-gray-200 dark:border-gray-600 rounded-lg p-6" in:fly={{ y: 20, duration: 300 }}>
                  <!-- Feed Item Header -->
                  <div class="flex items-start justify-between mb-4">
                    <div class="flex items-center space-x-3">
                      <div class="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                        {feedItem.author.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h3 class="font-semibold text-gray-900 dark:text-white">
                          {feedItem.author.name}
                        </h3>
                        <p class="text-sm text-gray-600 dark:text-gray-400">
                          {formatDate(feedItem.createdAt)}
                        </p>
                      </div>
                    </div>
                    
                    <button
                      on:click={() => openShareModal(feedItem)}
                      class="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    >
                      <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                      </svg>
                    </button>
                  </div>
                  
                  <!-- Feed Item Content -->
                  <div class="mb-4">
                    {#if feedItem.type === 'review'}
                      <div class="flex items-center space-x-2 mb-2">
                        <span class="text-lg">{getStarRating(feedItem.rating)}</span>
                        <span class="font-medium text-gray-900 dark:text-white">
                          {feedItem.rating}/5
                        </span>
                      </div>
                    {/if}
                    
                    <p class="text-gray-800 dark:text-gray-200">
                      {feedItem.content}
                    </p>
                    
                    {#if feedItem.tags && feedItem.tags.length > 0}
                      <div class="flex flex-wrap gap-2 mt-3">
                        {#each feedItem.tags as tag}
                          <span class="px-2 py-1 bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200 text-xs rounded-full">
                            {reviewTags.find(t => t.id === tag)?.emoji || ''} {reviewTags.find(t => t.id === tag)?.name || tag}
                          </span>
                        {/each}
                      </div>
                    {/if}
                  </div>
                  
                  <!-- Feed Item Actions -->
                  <div class="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-600">
                    <button
                      on:click={() => likeContent(feedItem)}
                      class="flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors"
                      class:bg-red-100={feedItem.liked}
                      class:text-red-600={feedItem.liked}
                      class:hover:bg-gray-100={!feedItem.liked}
                      class:dark:hover:bg-gray-700={!feedItem.liked}
                    >
                      <svg class="w-5 h-5" fill={feedItem.liked ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                      <span>{feedItem.likeCount || 0}</span>
                    </button>
                    
                    <div class="text-sm text-gray-500 dark:text-gray-400">
                      {feedItem.shareCount || 0} veces compartido
                    </div>
                  </div>
                </div>
              {/each}
            {:else}
              <!-- Empty Feed State -->
              <div class="text-center py-12" in:fade>
                <div class="text-6xl mb-4">🎆</div>
                <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  ¡Búnvate al feed social!
                </h3>
                <p class="text-gray-600 dark:text-gray-400 mb-6">
                  Comparte tus experiencias y conecta con otros usuarios
                </p>
                <Button variant="primary">
                  Escribe tu primera reseña
                </Button>
              </div>
            {/if}
          </div>
          
        {:else if activeTab === 'reviews'}
          <!-- User Reviews -->
          <div class="space-y-4" in:fade={{ duration: 200 }}>
            {#if userReviews.length > 0}
              {#each userReviews as review (review.id)}
                <div class="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                  <div class="flex items-start justify-between mb-3">
                    <div>
                      <h3 class="font-semibold text-gray-900 dark:text-white">
                        {review.providerName}
                      </h3>
                      <div class="flex items-center space-x-2">
                        <span class="text-lg">{getStarRating(review.rating)}</span>
                        <span class="text-sm text-gray-600 dark:text-gray-400">
                          {formatDate(review.createdAt)}
                        </span>
                      </div>
                    </div>
                    
                    <button
                      on:click={() => openShareModal(review)}
                      class="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    >
                      <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                      </svg>
                    </button>
                  </div>
                  
                  <p class="text-gray-700 dark:text-gray-300 mb-3">
                    {review.comment}
                  </p>
                  
                  {#if review.tags && review.tags.length > 0}
                    <div class="flex flex-wrap gap-2">
                      {#each review.tags as tag}
                        <span class="px-2 py-1 bg-green-100 dark:bg-green-800 text-green-800 dark:text-green-200 text-xs rounded-full">
                          {reviewTags.find(t => t.id === tag)?.emoji || ''} {reviewTags.find(t => t.id === tag)?.name || tag}
                        </span>
                      {/each}
                    </div>
                  {/if}
                </div>
              {/each}
            {:else}
              <!-- Empty Reviews State -->
              <div class="text-center py-12" in:fade>
                <div class="text-6xl mb-4">⭐</div>
                <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  Aún no tienes reseñas
                </h3>
                <p class="text-gray-600 dark:text-gray-400 mb-6">
                  Comparte tu experiencia con otros usuarios
                </p>
                <Button variant="primary">
                  Escribir Reseña
                </Button>
              </div>
            {/if}
          </div>
          
        {:else if activeTab === 'referrals'}
          <!-- Referrals Program -->
          <div in:fade={{ duration: 200 }}>
            <div class="bg-gradient-to-r from-green-500 to-blue-600 rounded-lg p-6 text-white mb-6">
              <h3 class="text-xl font-bold mb-2">
                🎉 Programa de Referidos
              </h3>
              <p class="mb-4">
                Invita a tus amigos y familiares y gana beneficios por cada referido exitoso
              </p>
              
              <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div class="text-center">
                  <div class="text-3xl font-bold">{referralData.totalReferrals || 0}</div>
                  <div class="text-sm opacity-75">Referidos Totales</div>
                </div>
                <div class="text-center">
                  <div class="text-3xl font-bold">${(referralData.totalEarnings || 0).toLocaleString('es-AR')}</div>
                  <div class="text-sm opacity-75">Ganancia Total</div>
                </div>
                <div class="text-center">
                  <div class="text-3xl font-bold">{referralData.pendingReferrals || 0}</div>
                  <div class="text-sm opacity-75">Pendientes</div>
                </div>
              </div>
            </div>
            
            <!-- Referral Code -->
            <div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg p-6 mb-6">
              <h4 class="font-semibold text-gray-900 dark:text-white mb-3">
                Tu Código de Referido
              </h4>
              
              <div class="flex items-center space-x-3">
                <code class="flex-1 px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg font-mono text-lg">
                  {referralData.referralCode || 'LOADING...'}
                </code>
                
                <Button
                  variant="secondary"
                  size="sm"
                  on:click={() => {
                    navigator.clipboard.writeText(referralData.referralCode);
                    alert('Código copiado al portapapeles');
                  }}
                >
                  Copiar
                </Button>
                
                <Button
                  variant="primary"
                  size="sm"
                  on:click={() => openShareModal({
                    type: 'referral',
                    id: referralData.referralCode,
                    name: 'Código de Referido BarberPro'
                  })}
                >
                  📱 Compartir
                </Button>
              </div>
            </div>
            
            <!-- How it Works -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div class="text-center">
                <div class="w-16 h-16 bg-blue-100 dark:bg-blue-800 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span class="text-2xl">👥</span>
                </div>
                <h4 class="font-semibold text-gray-900 dark:text-white mb-2">
                  1. Invita Amigos
                </h4>
                <p class="text-gray-600 dark:text-gray-400 text-sm">
                  Comparte tu código con familiares y amigos
                </p>
              </div>
              
              <div class="text-center">
                <div class="w-16 h-16 bg-green-100 dark:bg-green-800 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span class="text-2xl">💰</span>
                </div>
                <h4 class="font-semibold text-gray-900 dark:text-white mb-2">
                  2. Ellos Reservan
                </h4>
                <p class="text-gray-600 dark:text-gray-400 text-sm">
                  Cuando hacen su primera reserva usando tu código
                </p>
              </div>
              
              <div class="text-center">
                <div class="w-16 h-16 bg-purple-100 dark:bg-purple-800 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span class="text-2xl">🎉</span>
                </div>
                <h4 class="font-semibold text-gray-900 dark:text-white mb-2">
                  3. Tú Ganas
                </h4>
                <p class="text-gray-600 dark:text-gray-400 text-sm">
                  Obtienes crédito para futuras reservas
                </p>
              </div>
            </div>
          </div>
        {/if}
      </div>
    </div>
  {/if}
</div>

<!-- Review Modal -->
<Modal 
  open={showReviewModal} 
  on:close={() => { showReviewModal = false; selectedService = null; }}
  title="Escribir Reseña"
  size="medium"
>
  {#if selectedService}
    <div class="space-y-4">
      <!-- Service Info -->
      <div class="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
        <h3 class="font-semibold text-gray-900 dark:text-white">
          {selectedService.name}
        </h3>
        <p class="text-gray-600 dark:text-gray-400">
          {selectedService.providerName}
        </p>
      </div>
      
      <!-- Rating -->
      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Calificación
        </label>
        <div class="flex space-x-1">
          {#each [1, 2, 3, 4, 5] as star}
            <button
              on:click={() => reviewData.rating = star}
              class="text-2xl transition-colors"
              class:text-yellow-400={star <= reviewData.rating}
              class:text-gray-300={star > reviewData.rating}
            >
              ⭐
            </button>
          {/each}
        </div>
      </div>
      
      <!-- Comment -->
      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Comentario
        </label>
        <textarea
          bind:value={reviewData.comment}
          rows="4"
          class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
          placeholder="Comparte tu experiencia..."
        ></textarea>
      </div>
      
      <!-- Tags -->
      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Etiquetas (opcional)
        </label>
        <div class="flex flex-wrap gap-2">
          {#each reviewTags as tag}
            <button
              on:click={() => toggleReviewTag(tag.id)}
              class="px-3 py-1 rounded-full text-sm transition-colors"
              class:bg-blue-100={reviewData.tags.includes(tag.id)}
              class:text-blue-800={reviewData.tags.includes(tag.id)}
              class:dark:bg-blue-800={reviewData.tags.includes(tag.id)}
              class:dark:text-blue-200={reviewData.tags.includes(tag.id)}
              class:bg-gray-100={!reviewData.tags.includes(tag.id)}
              class:text-gray-700={!reviewData.tags.includes(tag.id)}
              class:dark:bg-gray-700={!reviewData.tags.includes(tag.id)}
              class:dark:text-gray-300={!reviewData.tags.includes(tag.id)}
            >
              {tag.emoji} {tag.name}
            </button>
          {/each}
        </div>
      </div>
      
      <!-- Would Recommend -->
      <div>
        <label class="flex items-center space-x-3">
          <input
            type="checkbox"
            bind:checked={reviewData.wouldRecommend}
            class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          >
          <span class="text-sm text-gray-700 dark:text-gray-300">
            Recomendaría este servicio
          </span>
        </label>
      </div>
      
      <!-- Form Actions -->
      <div class="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-3 space-y-3 space-y-reverse sm:space-y-0 pt-4 border-t border-gray-200 dark:border-gray-600">
        <Button
          variant="secondary"
          on:click={() => { showReviewModal = false; selectedService = null; }}
        >
          Cancelar
        </Button>
        
        <Button
          variant="primary"
          on:click={submitReview}
          class="flex items-center space-x-2"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
          <span>Publicar Reseña</span>
        </Button>
      </div>
    </div>
  {/if}
</Modal>

<!-- Share Modal -->
<Modal 
  open={showShareModal} 
  on:close={() => { showShareModal = false; shareContent = null; }}
  title="Compartir"
  size="small"
>
  {#if shareContent}
    <div class="space-y-4">
      <p class="text-gray-600 dark:text-gray-400">
        ¿Cómo te gustaría compartir esto?
      </p>
      
      <div class="grid grid-cols-1 gap-3">
        <!-- WhatsApp (Argentina optimized) -->
        <button
          on:click={() => shareContent('whatsapp')}
          class="flex items-center space-x-3 p-4 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-green-50 dark:hover:bg-green-900 transition-colors"
        >
          <div class="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center text-white">
            <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.109"/>
            </svg>
          </div>
          <div class="text-left">
            <div class="font-medium text-gray-900 dark:text-white">WhatsApp</div>
            <div class="text-sm text-gray-600 dark:text-gray-400">Preferido en Argentina</div>
          </div>
        </button>
        
        <!-- Instagram -->
        <button
          on:click={() => shareContent('instagram')}
          class="flex items-center space-x-3 p-4 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-900 transition-colors"
        >
          <div class="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center text-white">
            <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
            </svg>
          </div>
          <div class="text-left">
            <div class="font-medium text-gray-900 dark:text-white">Instagram</div>
            <div class="text-sm text-gray-600 dark:text-gray-400">Historias y posts</div>
          </div>
        </button>
        
        <!-- Copy Link -->
        <button
          on:click={() => shareContent('copy')}
          class="flex items-center space-x-3 p-4 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          <div class="w-10 h-10 bg-gray-500 rounded-lg flex items-center justify-center text-white">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </div>
          <div class="text-left">
            <div class="font-medium text-gray-900 dark:text-white">Copiar enlace</div>
            <div class="text-sm text-gray-600 dark:text-gray-400">Para cualquier plataforma</div>
          </div>
        </button>
      </div>
    </div>
  {/if}
</Modal>

<style>
  .tab-content {
    min-height: 400px;
  }
  
  /* Argentina mobile optimization */
  @media (max-width: 768px) {
    .md\:grid-cols-4 {
      grid-template-columns: repeat(2, 1fr);
    }
    
    .md\:grid-cols-3 {
      grid-template-columns: 1fr;
    }
  }
  
  /* Smooth animations */
  .transition-colors {
    transition-property: color, background-color, border-color;
    transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
    transition-duration: 150ms;
  }
  
  /* Star rating hover effects */
  button:hover .text-gray-300 {
    color: #fbbf24;
  }
</style>