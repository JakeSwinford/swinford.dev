<script lang="ts">
	import Mark from '#lib/Mark.svelte';
	import { about, experience, links, location, name, projects, resume } from '#lib/content.ts';

	const year = new Date().getFullYear();
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
		<a class="brand" href="/" aria-label="{name}, home">{name}</a>
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
		<div class="intro">
			<div class="plate">
				<Mark size="100%" drift label="Fig. 1 — z₁⁵ + z₂⁵ = 1. Calabi–Yau quintic, line screen" />
			</div>
			<p class="about">{about}</p>
		</div>

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
	</main>

	<footer class="foot label">
		<p>{location}</p>
		<p>© {year} {name}</p>
	</footer>
</div>

<style>
	/* One column, centered across the screen. */
	.page {
		--pad-x: clamp(20px, 4vw, 40px);
		--pad-y: clamp(20px, 3.4vh, 40px);

		display: flex;
		flex-direction: column;
		gap: 40px;
		width: min(100%, 720px + 2 * var(--pad-x));
		margin-inline: auto;
		padding: var(--pad-y) var(--pad-x);
	}

	.label {
		font: 500 11px/1.4 var(--mono);
		letter-spacing: 0.04em;
		text-transform: uppercase;
		color: var(--muted);
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

	.intro {
		display: grid;
		gap: 32px;
	}

	.plate {
		width: min(100%, 260px);
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

	.foot {
		display: flex;
		flex-wrap: wrap;
		justify-content: space-between;
		gap: 8px 24px;
		padding-top: 14px;
		border-top: 1px solid var(--rule);
	}

	/* ── Wider screens: the mark sits beside the intro ───────── */

	@media (min-width: 600px) {
		.intro {
			grid-template-columns: 200px 1fr;
			align-items: center;
		}

		.plate {
			width: auto;
		}
	}
</style>
