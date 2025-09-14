<script lang="ts">
	import { onMount, createEventDispatcher } from 'svelte';
	import { writable, derived } from 'svelte/store';
	import type { User, SocialPost, Achievement, CommunityChallenge } from '$lib/types';

	export let user: User;

	const dispatch = createEventDispatcher();

	// Social state
	const socialFeed = writable<SocialPost[]>([]);
	const achievements = writable<Achievement[]>([]);
	const challenges = writable<CommunityChallenge[]>([]);
	const userStats = writable({
		level: 1,
		points: 0,
		streak: 0,
		referrals: 0,
		badgesEarned: 0
	});
	const leaderboard = writable<any[]>([]);

	// Viral Growth Engine
	class ViralGrowthEngine {
		private userId: string;
		private socialData: any = {};

		constructor(userId: string) {
			this.userId = userId;
		}

		async initialize() {
			await this.loadSocialData();
			await this.loadAchievements();
			await this.loadChallenges();
			await this.loadLeaderboard();

			this.setupRealTimeUpdates();
			console.log('[ViralGrowth] Social engagement hub initialized');
		}

		private async loadSocialData() {
			try {
				const response = await fetch(`/api/social/feed/${this.userId}`, {
					headers: { 'Accept': 'application/json' }
				});

				if (response.ok) {
					const data = await response.json();
					socialFeed.set(data.posts || []);
					userStats.set(data.userStats || {});
				}
			} catch (error) {
				console.error('[ViralGrowth] Failed to load social data:', error);
			}
		}

		private async loadAchievements() {
			try {
				const response = await fetch(`/api/users/${this.userId}/achievements`, {
					headers: { 'Accept': 'application/json' }
				});

				if (response.ok) {
					const data = await response.json();
					achievements.set(data.achievements || []);
				}
			} catch (error) {
				console.error('[ViralGrowth] Failed to load achievements:', error);
			}
		}

		private async loadChallenges() {
			try {
				const response = await fetch('/api/social/challenges', {
					headers: { 'Accept': 'application/json' }
				});

				if (response.ok) {
					const data = await response.json();
					challenges.set(data.challenges || []);
				}
			} catch (error) {
				console.error('[ViralGrowth] Failed to load challenges:', error);
			}
		}

		private async loadLeaderboard() {
			try {
				const response = await fetch('/api/social/leaderboard', {
					headers: { 'Accept': 'application/json' }
				});

				if (response.ok) {
					const data = await response.json();
					leaderboard.set(data.leaderboard || []);
				}
			} catch (error) {
				console.error('[ViralGrowth] Failed to load leaderboard:', error);
			}
		}

		private setupRealTimeUpdates() {
			// Setup WebSocket or EventSource for real-time updates
			if ('WebSocket' in window) {
				const ws = new WebSocket(`wss://api.barberpro.com.ar/social/${this.userId}`);

				ws.onmessage = (event) => {
					const data = JSON.parse(event.data);
					this.handleRealTimeUpdate(data);
				};
			}
		}

		private handleRealTimeUpdate(data: any) {
			switch (data.type) {
				case 'new_achievement':
					this.showAchievementUnlocked(data.achievement);
					achievements.update(list => [data.achievement, ...list]);
					break;

				case 'points_earned':
					userStats.update(stats => ({
						...stats,
						points: stats.points + data.points
					}));
					break;

				case 'new_post':
					socialFeed.update(feed => [data.post, ...feed]);
					break;

				case 'leaderboard_update':
					leaderboard.set(data.leaderboard);
					break;
			}
		}

		async shareExperience(bookingId: string, rating: number, photos?: File[]) {
			try {
				const formData = new FormData();
				formData.append('bookingId', bookingId);
				formData.append('rating', rating.toString());
				formData.append('userId', this.userId);

				if (photos) {
					photos.forEach((photo, index) => {
						formData.append(`photo${index}`, photo);
					});
				}

				const response = await fetch('/api/social/share-experience', {
					method: 'POST',
					body: formData
				});

				if (response.ok) {
					const data = await response.json();
					socialFeed.update(feed => [data.post, ...feed]);

					// Award points for sharing
					this.awardPoints(10, 'experience_shared');

					dispatch('experience-shared', data.post);
					return data.post;
				}
			} catch (error) {
				console.error('[ViralGrowth] Failed to share experience:', error);
			}

			return null;
		}

		async generateReferralCode() {
			try {
				const response = await fetch(`/api/users/${this.userId}/referral-code`, {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' }
				});

				if (response.ok) {
					const data = await response.json();
					return data.referralCode;
				}
			} catch (error) {
				console.error('[ViralGrowth] Failed to generate referral code:', error);
			}

			return null;
		}

		async shareReferral(platform: 'whatsapp' | 'twitter' | 'facebook' | 'instagram' | 'copy') {
			const referralCode = await this.generateReferralCode();
			if (!referralCode) return;

			const shareText = `¡Descubre BarberPro! La mejor app para reservar servicios de belleza en Argentina. Usa mi código ${referralCode} y obtén 20% de descuento en tu primera reserva. 💇‍♂️✨`;
			const shareUrl = `https://barberpro.com.ar/register?ref=${referralCode}`;

			switch (platform) {
				case 'whatsapp':
					window.open(`https://wa.me/?text=${encodeURIComponent(shareText + ' ' + shareUrl)}`);
					break;

				case 'twitter':
					window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`);
					break;

				case 'facebook':
					window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(shareText)}`);
					break;

				case 'instagram':
					// Instagram doesn't support direct sharing, so copy to clipboard
					await navigator.clipboard.writeText(`${shareText} ${shareUrl}`);
					this.showToast('Texto copiado para Instagram Stories');
					break;

				case 'copy':
					await navigator.clipboard.writeText(`${shareText} ${shareUrl}`);
					this.showToast('Enlace de referido copiado');
					break;
			}

			// Track referral share
			this.trackEvent('referral_shared', { platform, referralCode });
			this.awardPoints(5, 'referral_shared');
		}

		async participateInChallenge(challengeId: string, actionData: any) {
			try {
				const response = await fetch(`/api/social/challenges/${challengeId}/participate`, {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						userId: this.userId,
						actionData
					})
				});

				if (response.ok) {
					const data = await response.json();

					// Update challenge progress
					challenges.update(list =>
						list.map(challenge =>
							challenge.id === challengeId ? data.challenge : challenge
						)
					);

					// Award points
					this.awardPoints(data.pointsEarned, 'challenge_participated');

					dispatch('challenge-participated', data);
					return data;
				}
			} catch (error) {
				console.error('[ViralGrowth] Failed to participate in challenge:', error);
			}

			return null;
		}

		private async awardPoints(points: number, reason: string) {
			userStats.update(stats => ({
				...stats,
				points: stats.points + points
			}));

			// Check for level up
			const newLevel = Math.floor((userStats.value.points + points) / 100) + 1;
			if (newLevel > userStats.value.level) {
				userStats.update(stats => ({ ...stats, level: newLevel }));
				this.showLevelUp(newLevel);
			}

			// Send to server
			try {
				await fetch(`/api/users/${this.userId}/award-points`, {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ points, reason })
				});
			} catch (error) {
				console.error('[ViralGrowth] Failed to award points:', error);
			}
		}

		private showAchievementUnlocked(achievement: Achievement) {
			// Show achievement notification
			const notification = document.createElement('div');
			notification.className = 'achievement-notification fixed top-4 right-4 bg-gradient-to-r from-yellow-400 to-orange-500 text-white p-4 rounded-xl shadow-lg z-50 transform translate-x-full';
			notification.innerHTML = `
				<div class="flex items-center space-x-3">
					<div class="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
						🏆
					</div>
					<div>
						<div class="font-bold">¡Logro Desbloqueado!</div>
						<div class="text-sm">${achievement.title}</div>
					</div>
				</div>
			`;

			document.body.appendChild(notification);

			// Animate in
			setTimeout(() => {
				notification.style.transform = 'translateX(0)';
			}, 100);

			// Auto remove after 5 seconds
			setTimeout(() => {
				notification.style.transform = 'translateX(100%)';
				setTimeout(() => {
					document.body.removeChild(notification);
				}, 300);
			}, 5000);
		}

		private showLevelUp(newLevel: number) {
			// Show level up notification
			this.showToast(`¡Nivel ${newLevel} alcanzado! 🎉`);
		}

		private showToast(message: string) {
			// Simple toast notification
			const toast = document.createElement('div');
			toast.className = 'toast fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-black/80 text-white px-4 py-2 rounded-lg z-50';
			toast.textContent = message;

			document.body.appendChild(toast);

			setTimeout(() => {
				document.body.removeChild(toast);
			}, 3000);
		}

		private trackEvent(event: string, data?: any) {
			if ('gtag' in window) {
				(window as any).gtag('event', event, data);
			}
		}
	}

	let viralEngine: ViralGrowthEngine;

	// Computed values
	const nextLevelProgress = derived(userStats, ($stats) => {
		const pointsToNextLevel = ($stats.level * 100) - $stats.points;
		const progress = (($stats.points % 100) / 100) * 100;
		return { pointsToNextLevel: Math.max(pointsToNextLevel, 0), progress };
	});

	const availableBadges = derived(achievements, ($achievements) => {
		const earnedBadges = $achievements.map(a => a.badgeId);
		const allBadges = [
			{ id: 'first_booking', title: 'Primera Reserva', icon: '🎯' },
			{ id: 'social_sharer', title: 'Influencer', icon: '📱' },
			{ id: 'loyal_customer', title: 'Cliente Fiel', icon: '💎' },
			{ id: 'referral_master', title: 'Maestro de Referencias', icon: '🌟' },
			{ id: 'review_expert', title: 'Experto en Reseñas', icon: '⭐' }
		];

		return allBadges.map(badge => ({
			...badge,
			earned: earnedBadges.includes(badge.id)
		}));
	});

	// Event handlers
	function handleShareExperience(bookingId: string) {
		// This would open a modal or form for sharing
		dispatch('open-share-modal', { bookingId });
	}

	async function handleReferralShare(platform: string) {
		await viralEngine.shareReferral(platform as any);
	}

	async function handleChallengeParticipation(challenge: CommunityChallenge) {
		await viralEngine.participateInChallenge(challenge.id, {
			action: 'participate',
			timestamp: Date.now()
		});
	}

	onMount(async () => {
		viralEngine = new ViralGrowthEngine(user.id);
		await viralEngine.initialize();
	});
</script>

<div class="social-engagement-hub">
	<!-- User Progress Header -->
	<div class="progress-header bg-gradient-to-br from-brand-600 to-primary-600 text-white rounded-2xl p-6 mb-6">
		<div class="flex items-center justify-between mb-4">
			<div class="flex items-center space-x-4">
				<div class="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center text-2xl font-bold">
					{$userStats.level}
				</div>
				<div>
					<h2 class="text-xl font-bold">Nivel {$userStats.level}</h2>
					<p class="text-white/80">
						{$userStats.points.toLocaleString()} puntos
						{#if $nextLevelProgress.pointsToNextLevel > 0}
							• {$nextLevelProgress.pointsToNextLevel} para siguiente nivel
						{/if}
					</p>
				</div>
			</div>

			<div class="text-right">
				<div class="text-2xl font-bold">{$userStats.streak}</div>
				<div class="text-sm text-white/80">días seguidos</div>
			</div>
		</div>

		<!-- Progress Bar -->
		<div class="w-full bg-white/20 rounded-full h-3 mb-4">
			<div
				class="bg-white rounded-full h-3 transition-all duration-500"
				style="width: {$nextLevelProgress.progress}%"
			></div>
		</div>

		<!-- Quick Stats -->
		<div class="grid grid-cols-3 gap-4 text-center">
			<div>
				<div class="text-lg font-bold">{$userStats.referrals}</div>
				<div class="text-xs text-white/70">Referencias</div>
			</div>
			<div>
				<div class="text-lg font-bold">{$userStats.badgesEarned}</div>
				<div class="text-xs text-white/70">Insignias</div>
			</div>
			<div>
				<div class="text-lg font-bold">{$achievements.length}</div>
				<div class="text-xs text-white/70">Logros</div>
			</div>
		</div>
	</div>

	<div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
		<!-- Main Content -->
		<div class="lg:col-span-2 space-y-6">
			<!-- Referral Program -->
			<div class="referral-section bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
				<div class="flex items-center justify-between mb-4">
					<h3 class="text-lg font-semibold text-neutral-800">Programa de Referencias</h3>
					<div class="text-sm bg-brand-50 text-brand px-3 py-1 rounded-full font-medium">
						20% descuento por referencia
					</div>
				</div>

				<p class="text-neutral-600 mb-4">
					Invita a tus amigos y obtén recompensas increíbles. Ambos reciben descuentos especiales.
				</p>

				<div class="share-buttons grid grid-cols-2 md:grid-cols-5 gap-3">
					<button
						class="share-btn whatsapp flex flex-col items-center p-4 rounded-lg hover:bg-green-50 transition-colors border border-neutral-200"
						on:click={() => handleReferralShare('whatsapp')}
					>
						<div class="w-8 h-8 bg-green-500 rounded-full mb-2 flex items-center justify-center text-white">
							💬
						</div>
						<span class="text-sm font-medium text-neutral-700">WhatsApp</span>
					</button>

					<button
						class="share-btn instagram flex flex-col items-center p-4 rounded-lg hover:bg-pink-50 transition-colors border border-neutral-200"
						on:click={() => handleReferralShare('instagram')}
					>
						<div class="w-8 h-8 bg-pink-500 rounded-full mb-2 flex items-center justify-center text-white">
							📷
						</div>
						<span class="text-sm font-medium text-neutral-700">Instagram</span>
					</button>

					<button
						class="share-btn twitter flex flex-col items-center p-4 rounded-lg hover:bg-blue-50 transition-colors border border-neutral-200"
						on:click={() => handleReferralShare('twitter')}
					>
						<div class="w-8 h-8 bg-blue-500 rounded-full mb-2 flex items-center justify-center text-white">
							🐦
						</div>
						<span class="text-sm font-medium text-neutral-700">Twitter</span>
					</button>

					<button
						class="share-btn facebook flex flex-col items-center p-4 rounded-lg hover:bg-blue-50 transition-colors border border-neutral-200"
						on:click={() => handleReferralShare('facebook')}
					>
						<div class="w-8 h-8 bg-blue-600 rounded-full mb-2 flex items-center justify-center text-white">
							📘
						</div>
						<span class="text-sm font-medium text-neutral-700">Facebook</span>
					</button>

					<button
						class="share-btn copy flex flex-col items-center p-4 rounded-lg hover:bg-neutral-50 transition-colors border border-neutral-200"
						on:click={() => handleReferralShare('copy')}
					>
						<div class="w-8 h-8 bg-neutral-500 rounded-full mb-2 flex items-center justify-center text-white">
							📋
						</div>
						<span class="text-sm font-medium text-neutral-700">Copiar</span>
					</button>
				</div>
			</div>

			<!-- Community Challenges -->
			<div class="challenges-section bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
				<h3 class="text-lg font-semibold text-neutral-800 mb-4">Desafíos de la Comunidad</h3>

				{#if $challenges.length > 0}
					<div class="space-y-4">
						{#each $challenges as challenge}
							<div class="challenge-card border border-neutral-200 rounded-lg p-4 hover:shadow-md transition-shadow">
								<div class="flex items-start justify-between mb-3">
									<div class="flex-1">
										<h4 class="font-semibold text-neutral-800 mb-1">{challenge.title}</h4>
										<p class="text-sm text-neutral-600 mb-2">{challenge.description}</p>
										<div class="flex items-center space-x-4 text-xs text-neutral-500">
											<span>Termina en: {new Date(challenge.endDate).toLocaleDateString('es-AR')}</span>
											<span>Recompensa: {challenge.reward} puntos</span>
										</div>
									</div>
									<div class="ml-4 text-2xl">{challenge.icon}</div>
								</div>

								<!-- Progress Bar -->
								<div class="mb-3">
									<div class="flex justify-between text-xs text-neutral-600 mb-1">
										<span>Progreso</span>
										<span>{challenge.progress}% completado</span>
									</div>
									<div class="w-full bg-neutral-200 rounded-full h-2">
										<div
											class="bg-brand rounded-full h-2 transition-all duration-500"
											style="width: {challenge.progress}%"
										></div>
									</div>
								</div>

								<button
									class="btn-sm btn-primary"
									on:click={() => handleChallengeParticipation(challenge)}
									disabled={challenge.completed}
								>
									{challenge.completed ? 'Completado' : 'Participar'}
								</button>
							</div>
						{/each}
					</div>
				{:else}
					<div class="text-center py-8 text-neutral-500">
						<div class="text-4xl mb-3">🏆</div>
						<p>No hay desafíos activos en este momento</p>
						<p class="text-sm">¡Vuelve pronto para más oportunidades!</p>
					</div>
				{/if}
			</div>

			<!-- Social Feed -->
			<div class="social-feed bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
				<h3 class="text-lg font-semibold text-neutral-800 mb-4">Experiencias de la Comunidad</h3>

				{#if $socialFeed.length > 0}
					<div class="space-y-4">
						{#each $socialFeed.slice(0, 5) as post}
							<div class="post-card border-b border-neutral-100 pb-4 last:border-b-0">
								<div class="flex items-start space-x-3 mb-3">
									<img
										src={post.author.avatar || '/images/default-avatar.jpg'}
										alt={post.author.name}
										class="w-10 h-10 rounded-full object-cover"
									/>
									<div class="flex-1">
										<div class="flex items-center space-x-2 mb-1">
											<span class="font-medium text-neutral-800">{post.author.name}</span>
											<span class="text-xs text-neutral-500">
												{new Date(post.createdAt).toLocaleDateString('es-AR')}
											</span>
										</div>
										<p class="text-sm text-neutral-600">{post.content}</p>
									</div>
								</div>

								{#if post.images && post.images.length > 0}
									<div class="grid grid-cols-2 gap-2 mb-3">
										{#each post.images.slice(0, 4) as image}
											<img
												src={image.url}
												alt="Experiencia compartida"
												class="w-full h-32 object-cover rounded-lg"
											/>
										{/each}
									</div>
								{/if}

								<div class="flex items-center space-x-4 text-sm text-neutral-500">
									<button class="flex items-center space-x-1 hover:text-brand transition-colors">
										<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
										</svg>
										<span>{post.likes || 0}</span>
									</button>
									<button class="flex items-center space-x-1 hover:text-brand transition-colors">
										<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
										</svg>
										<span>{post.comments || 0}</span>
									</button>
								</div>
							</div>
						{/each}
					</div>
				{:else}
					<div class="text-center py-8 text-neutral-500">
						<div class="text-4xl mb-3">📱</div>
						<p>¡Sé el primero en compartir tu experiencia!</p>
					</div>
				{/if}
			</div>
		</div>

		<!-- Sidebar -->
		<div class="space-y-6">
			<!-- Achievements & Badges -->
			<div class="badges-section bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
				<h3 class="text-lg font-semibold text-neutral-800 mb-4">Insignias</h3>

				<div class="grid grid-cols-3 gap-3">
					{#each $availableBadges as badge}
						<div
							class="badge-item text-center p-3 rounded-lg border border-neutral-200 transition-all"
							class:bg-yellow-50={badge.earned}
							class:border-yellow-200={badge.earned}
							class:opacity-50={!badge.earned}
						>
							<div class="text-2xl mb-1">{badge.icon}</div>
							<div class="text-xs font-medium text-neutral-700">{badge.title}</div>
						</div>
					{/each}
				</div>

				{#if $achievements.length > 0}
					<div class="mt-4 pt-4 border-t border-neutral-200">
						<h4 class="font-medium text-neutral-800 mb-2">Últimos Logros</h4>
						<div class="space-y-2">
							{#each $achievements.slice(0, 3) as achievement}
								<div class="flex items-center space-x-2">
									<span class="text-lg">{achievement.icon}</span>
									<div class="flex-1">
										<div class="text-sm font-medium text-neutral-800">{achievement.title}</div>
										<div class="text-xs text-neutral-500">{achievement.description}</div>
									</div>
								</div>
							{/each}
						</div>
					</div>
				{/if}
			</div>

			<!-- Leaderboard -->
			<div class="leaderboard-section bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
				<h3 class="text-lg font-semibold text-neutral-800 mb-4">Ranking Semanal</h3>

				{#if $leaderboard.length > 0}
					<div class="space-y-3">
						{#each $leaderboard.slice(0, 10) as leader, index}
							<div
								class="flex items-center space-x-3 p-2 rounded-lg"
								class:bg-yellow-50={index < 3}
								class:bg-brand-50={leader.id === user.id}
							>
								<div
									class="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
									class:bg-yellow-500={index === 0}
									class:bg-neutral-300={index === 1}
									class:bg-orange-400={index === 2}
									class:bg-neutral-200={index >= 3}
									class:text-white={index < 3}
									class:text-neutral-700={index >= 3}
								>
									{index + 1}
								</div>

								<img
									src={leader.avatar || '/images/default-avatar.jpg'}
									alt={leader.name}
									class="w-8 h-8 rounded-full object-cover"
								/>

								<div class="flex-1">
									<div class="text-sm font-medium text-neutral-800">
										{leader.name}
										{#if leader.id === user.id}
											<span class="text-xs text-brand">(Tú)</span>
										{/if}
									</div>
								</div>

								<div class="text-sm font-bold text-neutral-600">
									{leader.points.toLocaleString()}
								</div>
							</div>
						{/each}
					</div>
				{:else}
					<div class="text-center py-4 text-neutral-500">
						<div class="text-2xl mb-2">🏆</div>
						<p class="text-sm">Cargando ranking...</p>
					</div>
				{/if}
			</div>
		</div>
	</div>
</div>

<style>
	.social-engagement-hub {
		@apply max-w-6xl mx-auto p-4;
	}

	.share-btn:hover {
		transform: translateY(-2px);
	}

	.challenge-card:hover {
		transform: translateY(-2px);
	}

	.badge-item.earned {
		animation: sparkle 0.6s ease-in-out;
	}

	@keyframes sparkle {
		0%, 100% { transform: scale(1); }
		50% { transform: scale(1.1); }
	}

	.achievement-notification {
		animation: slideInFromRight 0.5s ease-out;
		transition: transform 0.3s ease-out;
	}

	.toast {
		animation: fadeInUp 0.3s ease-out;
	}

	@keyframes slideInFromRight {
		from {
			transform: translateX(100%);
		}
		to {
			transform: translateX(0);
		}
	}

	@keyframes fadeInUp {
		from {
			opacity: 0;
			transform: translate(-50%, 20px);
		}
		to {
			opacity: 1;
			transform: translate(-50%, 0);
		}
	}

	@media (max-width: 768px) {
		.social-engagement-hub {
			@apply p-2;
		}

		.share-buttons {
			@apply grid-cols-3 gap-2;
		}

		.share-btn {
			@apply p-2;
		}

		.share-btn .w-8.h-8 {
			@apply w-6 h-6;
		}
	}
</style>