const extensionIdeas = [
	"tab timer",
	"bookmark pet",
	"homework blocker",
	"site restyler",
];

const perks = [
	{
		title: "1. make an extension",
		body: "content scripts, popup buttons, tiny tools, silly web powers. ship one thing that changes how a browser feels.",
	},
	{
		title: "2. post the demo",
		body: "show the manifest, the popup, and the thing it changes. Hack Club should be able to see it working.",
	},
	{
		title: "3. get browser merch",
		body: "Barnav sends browser-flavored rewards when your extension makes it onto the web.",
	},
];

const toolbarItems = ["Back", "Forward", "Refresh", "Home", "Mail"];

export default function Home() {
	return (
		<main className="retro-desktop min-h-screen overflow-hidden p-2 text-[#050505] sm:p-5">
			<div className="mx-auto max-w-7xl">
				<div className="retro-window">
					<header>
						<div className="title-bar">
							<div className="flex min-w-0 items-center gap-2">
								<span className="app-icon">W</span>
								<span className="truncate font-bold">
									Widget Explorer - Hack Club Browser Challenge
								</span>
							</div>
							<div aria-hidden="true" className="window-controls">
								<span>_</span>
								<span>□</span>
								<span>x</span>
							</div>
						</div>

						<div className="menu-row">
							<span>File</span>
							<span>Edit</span>
							<span>View</span>
							<span>Favorites</span>
							<span>Tools</span>
							<span>Help</span>
						</div>

						<div className="toolbar-row">
							{toolbarItems.map((item) => (
								<button className="toolbar-button" key={item} type="button">
									<span className="toolbar-icon" />
									{item}
								</button>
							))}
						</div>

						<div className="address-row">
							<span className="shrink-0">Address</span>
							<div className="address-box">
								<span className="address-lock">★</span>
								<span className="truncate">
									https://hackclub.com/widget/you-ship-we-ship
								</span>
							</div>
							<button className="go-button" type="button">
								Go
							</button>
						</div>
					</header>

					<section className="page-scroll">
						<div className="marquee-strip">
							<div className="marquee-track">
								Widget is loading rewards... make browser extensions... get
								browser merch... powered by Hack Club... built by Barnav...
							</div>
						</div>

						<div className="hero-grid">
							<div className="hero-copy">
								<div className="badge-2000">
									<span className="blink-dot" />
									now accepting extensions
								</div>
								<h1>
									You ship.
									<br />
									We ship.
								</h1>
								<p>
									Widget is a Hack Club challenge by Barnav about making the
									browser weird, useful, personal, and yours. Build a real
									browser extension, publish a demo, and earn browser merch.
								</p>
								<div className="hero-actions">
									<a className="primary-retro" href="https://hackclub.com">
										Start building
									</a>
									<a className="secondary-retro" href="#steps">
										How it works
									</a>
								</div>
							</div>

							<div className="install-window">
								<div className="mini-title">
									<span>Widget Setup Wizard</span>
									<span>x</span>
								</div>
								<div className="install-body">
									<div aria-hidden="true" className="cd-spin">
										W
									</div>
									<div>
										<h2>Install browser superpowers?</h2>
										<p>
											Make a popup, modify a page, add a toolbar button, then
											ship it for merch.
										</p>
									</div>
									<div
										aria-label="Extension progress"
										aria-valuemax={100}
										aria-valuemin={0}
										aria-valuenow={72}
										className="progress-shell"
										role="progressbar"
									>
										<div className="progress-bar" />
									</div>
									<div className="wizard-buttons">
										<button type="button">Back</button>
										<button type="button">Next</button>
										<button type="button">Cancel</button>
									</div>
								</div>
							</div>
						</div>

						<ul aria-label="Extension ideas" className="idea-strip">
							{extensionIdeas.map((idea) => (
								<li className="idea-chip" key={idea}>
									<span className="tiny-window" />
									{idea}
								</li>
							))}
						</ul>

						<div className="content-grid" id="steps">
							<section className="retro-panel">
								<div className="panel-title">Widget shipping checklist</div>
								<div className="panel-body">
									{perks.map((perk) => (
										<article className="check-row" key={perk.title}>
											<div className="checkbox-fake" />
											<div>
												<h2>{perk.title}</h2>
												<p>{perk.body}</p>
											</div>
										</article>
									))}
								</div>
							</section>

							<aside className="retro-panel">
								<div className="panel-title">Extension preview</div>
								<div className="panel-body">
									<div className="extension-card">
										<div className="extension-top">
											<div className="extension-logo">W</div>
											<div>
												<strong>Widget Helper</strong>
												<p>active on this tab</p>
											</div>
										</div>
										<div className="code-lines">
											<span />
											<span />
											<span />
										</div>
										<div className="status-callout">
											ship detected: popup + content script + icon
										</div>
									</div>
								</div>
							</aside>
						</div>
					</section>

					<footer className="status-bar">
						<span>Done</span>
						<span>Internet zone</span>
						<span>Widget merch connection: online</span>
					</footer>
				</div>
			</div>
		</main>
	);
}
