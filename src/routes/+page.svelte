<script lang="ts">
	import { onMount } from 'svelte';
	import Mark from '#lib/Mark.svelte';
	import { about, experience, links, location, name, projects, resume } from '#lib/content.ts';

	const year = new Date().getFullYear();

	let brand = $state<ReturnType<typeof Mark>>();

	// The header mark turns once as the page opens, and again on hover.
	onMount(() => {
		const timer = setTimeout(() => brand?.turn(), 400);
		return () => clearTimeout(timer);
	});
</script>

<svelte:head>
	<title>{name} — Software Engineer</title>
	<meta name="description" content={about} />
	<meta property="og:title" content={name} />
	<meta property="og:description" content={about} />
	<meta property="og:type" content="website" />
</svelte:head>

<div class="page">
	<header class="top">
		<a class="brand" href="/" aria-label="{name}, home" onmouseenter={() => brand?.turn()}>
			<Mark size={32} bind:this={brand} />
			<span>{name}</span>
		</a>
		<ul class="links">
			<li>
				<a href={resume} target="_blank">Resume<span class="arrow" aria-hidden="true">↗</span></a>
			</li>
			{#each links as link (link.href)}
				<li>
					<a href={link.href} target="_blank" rel="me noopener noreferrer">
						{link.label}<span class="arrow" aria-hidden="true">↗</span>
					</a>
				</li>
			{/each}
		</ul>
	</header>

	<main class="main">
		<p class="about">{about}</p>

		<section class="experience" aria-labelledby="experience">
			<h2 id="experience" class="label">Experience</h2>
			<ol>
				{#each experience as role (role.org)}
					<li class="item">
						<div class="line">
							<h3>
								{role.org}
								{#if role.current}<span class="dot" role="img" aria-label="current"></span>{/if}
							</h3>
							<span class="label">{role.years}</span>
						</div>
						<p>{role.title}</p>
					</li>
				{/each}
			</ol>
		</section>

		<section class="projects" aria-labelledby="working-on">
			<h2 id="working-on" class="label">Working on</h2>
			<ul>
				{#each projects as project (project.name)}
					<li class="item">
						<div class="line">
							<h3>
								{#if project.href}
									<a href={project.href} target="_blank" rel="noopener">
										{project.name}<span class="arrow" aria-hidden="true">↗</span>
									</a>
								{:else}
									{project.name}
								{/if}
							</h3>
							<span class="label kind">{project.kind}</span>
						</div>
						<p>{project.summary}</p>
					</li>
				{/each}
			</ul>
		</section>

		<figure class="plate">
			<Mark
				size="100%"
				drift
				label="The Swinford mark, a line-screen rendering of the Calabi–Yau quintic"
			/>
			<figcaption class="label">
				<span>Fig. 1 — z₁⁵ + z₂⁵ = 1</span>
				<span class="faint">Calabi–Yau quintic, line screen</span>
			</figcaption>
		</figure>
	</main>

	<footer class="foot label">
		<p>{location}</p>
		<p>© {year} {name}</p>
	</footer>
</div>

<style>
	.page {
		--pad-x: clamp(20px, 4vw, 64px);
		--pad-y: clamp(20px, 3.4vh, 40px);

		display: flex;
		flex-direction: column;
		gap: 56px;
		/* Content tops out at 1440px and centers on very wide screens. */
		padding: var(--pad-y) max(var(--pad-x), (100% - 1440px) / 2);
	}

	.label {
		font: 500 11px/1.4 var(--mono);
		letter-spacing: 0.04em;
		text-transform: uppercase;
		color: var(--muted);
	}

	.faint {
		color: var(--faint);
	}

	.arrow {
		margin-left: 4px;
		color: var(--muted);
	}

	/* ── Header ──────────────────────────────────────────────── */

	.top {
		display: flex;
		flex-wrap: wrap;
		justify-content: space-between;
		align-items: center;
		gap: 12px 24px;
	}

	.brand {
		display: inline-flex;
		align-items: center;
		gap: 10px;
		font-weight: 500;
		letter-spacing: -0.01em;
		text-decoration: none;
	}

	.links {
		display: flex;
		gap: 20px;
		font: 13px/1.4 var(--mono);
	}

	.links a {
		text-decoration: none;
	}

	.links a:hover,
	.item a:hover {
		text-decoration: underline;
	}

	/* ── Body ────────────────────────────────────────────────── */

	.main {
		display: grid;
		gap: 48px;
	}

	.about {
		max-width: 34em;
		font-size: 19px;
		line-height: 1.45;
		letter-spacing: -0.012em;
		text-wrap: pretty;
	}

	section h2 {
		padding-bottom: 10px;
		border-bottom: 1px solid var(--rule);
	}

	.item {
		padding-top: 14px;
	}

	.line {
		display: flex;
		justify-content: space-between;
		align-items: baseline;
		gap: 12px;
	}

	.line .label {
		flex: none;
	}

	/* Kinds like iOS and SaaS keep their own casing. */
	.kind {
		text-transform: none;
	}

	.item h3 {
		display: flex;
		align-items: center;
		gap: 8px;
		font-size: 15px;
		font-weight: 500;
		letter-spacing: -0.005em;
	}

	.item a {
		text-decoration: none;
	}

	.item p {
		margin-top: 1px;
		font-size: 14px;
		line-height: 1.45;
		color: var(--muted);
	}

	.dot {
		width: 6px;
		height: 6px;
		border-radius: 50%;
		background: var(--spot);
	}

	.plate {
		display: flex;
		flex-direction: column;
		gap: 14px;
		width: min(100%, 260px);
	}

	.plate figcaption {
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.foot {
		display: flex;
		flex-wrap: wrap;
		justify-content: space-between;
		gap: 8px 24px;
		padding-top: 14px;
		border-top: 1px solid var(--rule);
	}

	/* ── Tablet: lists side by side ──────────────────────────── */

	@media (min-width: 720px) {
		.main {
			grid-template-columns: 1fr 1fr;
			column-gap: 40px;
		}

		.about,
		.plate {
			grid-column: 1 / -1;
		}
	}

	/* ── Desktop: everything on one screen ───────────────────── */

	/* The page stretches to exactly one viewport and centers the body between the
	   header and footer. On a short screen where it doesn't fit, it scrolls rather
	   than clipping. */
	@media (min-width: 1024px) and (min-height: 600px) {
		.page {
			--plate: min(28vw, 50vh, 480px);

			min-height: 100dvh;
			gap: clamp(20px, 3.4vh, 48px);
		}

		.main {
			flex: 1;
			grid-template-columns: 1fr 1fr var(--plate);
			grid-template-areas:
				'about about plate'
				'experience projects plate';
			align-content: center;
			column-gap: clamp(32px, 4vw, 72px);
			row-gap: clamp(28px, 6vh, 88px);
		}

		.about {
			grid-area: about;
			/* Grows with the screen, held back on short ones. */
			font-size: clamp(19px, min(1.55vw, 3vh), 30px);
		}

		.experience {
			grid-area: experience;
		}

		.projects {
			grid-area: projects;
		}

		.plate {
			grid-area: plate;
			align-self: center;
			width: auto;
		}

		.item {
			padding-top: clamp(8px, 1.6vh, 20px);
		}
	}
</style>
