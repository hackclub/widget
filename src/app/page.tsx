"use client";

import {
	type FormEvent,
	type PointerEvent,
	useCallback,
	useEffect,
	useRef,
	useState,
} from "react";

import { api } from "~/trpc/react";

type WindowDragStart = {
	pointerX: number;
	pointerY: number;
	windowX: number;
	windowY: number;
};

type BrowserTab = "widget" | "guides" | "shop" | "platform";
type ProjectStatus = "draft" | "submitted";

type PrizeCard = {
	category: string;
	title: string;
	detail: string;
	hours: number;
};

type ProjectFormState = {
	codebaseUrl: string;
	description: string;
	hackClubInfo: string;
	name: string;
	playableUrl: string;
	screenshotUrl: string;
	status: ProjectStatus;
};

const ideas = [
	"highlight every deadline on any site",
	"turn new tabs into a tiny plant garden",
	"save funny page snippets into a scrapbook",
	"replace boring buttons with arcade sounds",
	"add a focus timer to homework pages",
	"turn every price tag into cups of boba",
	"make a homework panic button that opens calming tabs",
	"add confetti when you finish reading an article",
	"translate boring error messages into pirate talk",
	"replace social media like buttons with tiny frogs",
	"make every website look like a sticky note board",
	"add a mood ring to the browser toolbar",
	"turn long paragraphs into tiny comic panels",
	"save tabs into playlists named after your mood",
	"make a web page bedtime mode after midnight",
	"add a daily quest checklist to new tabs",
	"turn product reviews into dramatic movie posters",
	"replace loading spinners with dancing toast",
	"make a button that compliments the current website",
	"add a tiny weather pet to every page",
	"turn highlighted text into instant flashcards",
	"make a tab graveyard for pages you abandoned",
	"replace every ad box with a drawing prompt",
	"add a fake applause track when you submit forms",
	"turn YouTube titles into fortune cookie messages",
	"make a bookmark shelf that looks like a fridge",
	"add tiny progress bars to long articles",
	"turn school portal pages into RPG stats",
	"replace every password field with a secret lair vibe",
	"make a calendar countdown that nags nicely",
	"turn browser history into a travel map",
	"add a mini pomodoro tomato to any page",
	"make a new tab page that grows with your streak",
	"turn tabs into trading cards",
	"add keyboard shortcuts for your favorite sites",
	"replace boring form labels with friendly hints",
	"make a sidebar for saving one-sentence notes",
	"turn selected text into a fake newspaper headline",
	"add a tiny pixel garden to GitHub commits",
	"make a shopping cart guilt translator",
	"turn every image on a page into a museum plaque",
	"add a chaos slider that changes page fonts",
	"make a tab timer that tells you how long you lingered",
	"replace empty states with motivational sticky notes",
	"turn any site into dark mode at sunset",
	"make a button that hides spoilers on command",
	"add a tiny mascot that reacts to scrolling",
	"turn article headings into a table of quests",
	"save funny comments into a scrapbook drawer",
	"make a browser extension that rates tab names",
	"add a fake loading bar for dramatic entrances",
	"turn copied links into cute share cards",
	"make a page cleaner that removes visual clutter",
	"add a random snack suggestion to new tabs",
	"turn code blocks into printable cheat sheets",
	"make a site soundtrack picker",
	"add a tiny mailbox for links to read later",
	"turn recipes into grocery scavenger hunts",
	"make a zoom class bingo card overlay",
	"replace broken images with pixel art placeholders",
	"add a tab boss fight when too many tabs are open",
	"turn every page title into a haiku",
	"make a sidebar that explains selected words simply",
	"add a tiny receipt printer for saved links",
	"turn browser bookmarks into a desktop of icons",
	"make a hydration reminder that lives in the toolbar",
	"replace page backgrounds with notebook paper",
	"add a quick emoji reaction to any paragraph",
	"turn todo lists into mini boss battles",
	"make a screenshot sticker maker",
	"add a fake desktop assistant for one website",
	"turn search results into a treasure map",
	"make a tab sorter by school subject",
	"add a word counter that talks like a coach",
	"turn news headlines into calm summaries",
	"make a browser pet that gets sleepy with idle tabs",
	"replace every boring button with arcade cabinet buttons",
	"add a tiny stopwatch beside online quizzes",
	"turn form submissions into victory screens",
	"make a color picker for any website palette",
	"add a sidebar that stores tiny wins from the day",
	"turn link previews into baseball cards",
	"make a browser extension that detects fake productivity",
	"add a random compliment to every new tab",
	"turn webpage sections into collapsible drawers",
	"make a study streak stamp card",
	"replace cursors with silly themed pointers",
	"add a one-click page outline for essays",
	"turn online docs into cozy reading mode",
	"make a tab limit alarm with dramatic warnings",
	"add a mini whiteboard over any website",
	"turn highlighted code into plain English notes",
	"make a browser extension that names your tab groups",
	"add a tiny scoreboard for finished tasks",
	"turn links into sticky-note previews",
	"make a new tab jukebox for focus playlists",
	"add page annotations that look like comic speech bubbles",
	"turn dropdown menus into spinning prize wheels",
	"make a website nostalgia filter from the 2000s",
	"add a reminder when a page has been open too long",
	"turn email subjects into urgency labels",
	"make a button that cleans up duplicate tabs",
	"add a tiny ruler for measuring webpage elements",
	"turn any site into a printable zine layout",
	"make a browser extension that rewards closing tabs",
];

const prizeCards: [PrizeCard, ...PrizeCard[]] = [
	{
		category: "browser merch",
		title: "Chrome Dino Encore Sweatshirt",
		detail: "limited browser gear",
		hours: 12,
	},
	{
		category: "browser stickers",
		title: "Firefox + Chrome sticker sheet",
		detail: "cover your laptop",
		hours: 2,
	},
	{
		category: "widget mice",
		title: "Tiny cursor mouse",
		detail: "for extension builders",
		hours: 5,
	},
	{
		category: "widget keyboard",
		title: "Clicky shortcut keyboard",
		detail: "macro keys for the web",
		hours: 9,
	},
	{
		category: "domain grants",
		title: "Free domain for your extension",
		detail: "ship it on the open web",
		hours: 4,
	},
	{
		category: "web lab",
		title: "Hosting credits",
		detail: "keep your demo online",
		hours: 10,
	},
	{
		category: "desk loot",
		title: "Browser tab enamel pin",
		detail: "retro web hardware vibes",
		hours: 3,
	},
];

const visiblePrizeCardCount = 2;
const hourlyEarnings = 8.5;
const userBudgetPerHour = 4;
const profitPerHour = hourlyEarnings - userBudgetPerHour;

const addressBarMessages = [
	"Why would you do anything but Widget?",
	"Nice try. Widget is the whole internet now.",
	"Address rejected. Please return to Widget.",
	"Typing privileges revoked by the Widget council.",
];

const guideTracks = [
	{
		title: "Set up",
		steps: ["make a folder", "add manifest.json", "load unpacked in Chrome"],
	},
	{
		title: "Make it",
		steps: ["pick one page job", "write popup.js", "test on real sites"],
	},
	{
		title: "Ship it",
		steps: ["zip the folder", "record a demo", "submit your build"],
	},
];

const starterGuides = [
	{
		name: "Tab Garden",
		description: "grow a plant every time you open a new tab",
	},
	{
		name: "Deadline Highlighter",
		description: "mark dates and countdowns on school pages",
	},
	{
		name: "Tiny Scrapbook",
		description: "save quotes, links, and screenshots from any page",
	},
	{
		name: "Button DJ",
		description: "add arcade sounds to boring web buttons",
	},
];

const footerLinks = [
	{
		label: "Terms of Service",
		href: "https://hackclub.com/privacy-and-terms#hack-club-standard-terms-and-conditions",
	},
	{
		label: "Privacy Policy",
		href: "https://hackclub.com/privacy-and-terms#hack-club-privacy-notice",
	},
	{
		label: "Fulfillment Bounty",
		href: "https://forms.hackclub.com/bounty",
	},
];

const emptyProjectForm: ProjectFormState = {
	codebaseUrl: "",
	description: "",
	hackClubInfo: "",
	name: "",
	playableUrl: "",
	screenshotUrl: "",
	status: "draft",
};

export default function Home() {
	const utils = api.useUtils();
	const sessionQuery = api.auth.me.useQuery();
	const session = sessionQuery.data;
	const projectsQuery = api.projects.listMine.useQuery(undefined, {
		enabled: Boolean(session),
	});
	const createProject = api.projects.create.useMutation({
		onSuccess: async () => {
			setProjectForm(emptyProjectForm);
			await utils.projects.listMine.invalidate();
		},
	});
	const [activeTab, setActiveTab] = useState<BrowserTab>("widget");
	const [projectForm, setProjectForm] =
		useState<ProjectFormState>(emptyProjectForm);
	const [isGuidesTabOpen, setIsGuidesTabOpen] = useState(false);
	const [isGuidesTabClosing, setIsGuidesTabClosing] = useState(false);
	const [isShopTabOpen, setIsShopTabOpen] = useState(false);
	const [isShopTabClosing, setIsShopTabClosing] = useState(false);
	const [isPlatformTabOpen, setIsPlatformTabOpen] = useState(false);
	const [isPlatformTabClosing, setIsPlatformTabClosing] = useState(false);
	const [ideaIndex, setIdeaIndex] = useState(0);
	const [addressMessage, setAddressMessage] = useState<string | null>(null);
	const [addressMessageIndex, setAddressMessageIndex] = useState(0);
	const [addressInput, setAddressInput] = useState("");
	const [hasAddressEdit, setHasAddressEdit] = useState(false);
	const [isEasterEggOpen, setIsEasterEggOpen] = useState(false);
	const [isPunchcardOpen, setIsPunchcardOpen] = useState(false);
	const windowRef = useRef<HTMLDivElement>(null);
	const windowPositionRef = useRef({ x: 0, y: 0 });
	const addressTakeoverTimeout = useRef<number | null>(null);
	const nyanAudioRef = useRef<HTMLAudioElement | null>(null);
	const idea = ideas[ideaIndex] ?? ideas[0];
	const prizeStack = prizeCards.slice(0, visiblePrizeCardCount);
	const dragStartRef = useRef<WindowDragStart | null>(null);
	const [showAlreadyHere, setShowAlreadyHere] = useState(false);
	const [alreadyHereFading, setAlreadyHereFading] = useState(false);
	const alreadyHereTimeout = useRef<number | null>(null);
	const goButtonWrapRef = useRef<HTMLDivElement>(null);
	const addressByTab: Record<BrowserTab, string> = {
		widget: "https://widget.hackclub.com",
		guides: "https://widget.hackclub.com/guides",
		platform: "https://widget.hackclub.com/platform",
		shop: "https://widget.hackclub.com/shop",
	};
	const address = addressByTab[activeTab];
	const shouldShowTabBar =
		isGuidesTabOpen ||
		isGuidesTabClosing ||
		isShopTabOpen ||
		isShopTabClosing ||
		isPlatformTabOpen ||
		isPlatformTabClosing;
	const isTabBarClosing =
		(isGuidesTabClosing && !isShopTabOpen && !isPlatformTabOpen) ||
		(isShopTabClosing && !isGuidesTabOpen && !isPlatformTabOpen) ||
		(isPlatformTabClosing && !isGuidesTabOpen && !isShopTabOpen);

	useEffect(() => {
		if (addressMessage || hasAddressEdit) {
			return;
		}

		setAddressInput(address);
	}, [address, addressMessage, hasAddressEdit]);

	useEffect(() => {
		const params = new URLSearchParams(window.location.search);

		if (params.get("platform") === "1") {
			setIsPlatformTabClosing(false);
			setIsPlatformTabOpen(true);
			setActiveTab("platform");
		}
	}, []);

	useEffect(() => {
		if (!addressMessage) {
			return;
		}

		const resetAddress = window.setTimeout(() => {
			setAddressMessage(null);
			setAddressInput(address);
		}, 1800);

		return () => window.clearTimeout(resetAddress);
	}, [address, addressMessage]);

	useEffect(() => {
		return () => {
			if (addressTakeoverTimeout.current) {
				window.clearTimeout(addressTakeoverTimeout.current);
			}

			if (nyanAudioRef.current) {
				nyanAudioRef.current.pause();
				nyanAudioRef.current = null;
			}

			if (alreadyHereTimeout.current) {
				window.clearTimeout(alreadyHereTimeout.current);
			}
		};
	}, []);

	useEffect(() => {
		if (!isGuidesTabClosing) {
			return;
		}

		const closeTab = window.setTimeout(() => {
			setIsGuidesTabOpen(false);
			setIsGuidesTabClosing(false);
		}, 180);

		return () => window.clearTimeout(closeTab);
	}, [isGuidesTabClosing]);

	useEffect(() => {
		if (!isShopTabClosing) {
			return;
		}

		const closeTab = window.setTimeout(() => {
			setIsShopTabOpen(false);
			setIsShopTabClosing(false);
		}, 180);

		return () => window.clearTimeout(closeTab);
	}, [isShopTabClosing]);

	useEffect(() => {
		if (!isPlatformTabClosing) {
			return;
		}

		const closeTab = window.setTimeout(() => {
			setIsPlatformTabOpen(false);
			setIsPlatformTabClosing(false);
		}, 180);

		return () => window.clearTimeout(closeTab);
	}, [isPlatformTabClosing]);

	function startDrag(event: PointerEvent<HTMLDivElement>) {
		if (event.button !== 0) {
			return;
		}

		event.currentTarget.setPointerCapture(event.pointerId);
		dragStartRef.current = {
			pointerX: event.clientX,
			pointerY: event.clientY,
			windowX: windowPositionRef.current.x,
			windowY: windowPositionRef.current.y,
		};
		windowRef.current?.classList.add("is-dragging");
	}

	function dragWindow(event: PointerEvent<HTMLDivElement>) {
		if (!dragStartRef.current) {
			return;
		}

		const x =
			dragStartRef.current.windowX +
			event.clientX -
			dragStartRef.current.pointerX;
		const y =
			dragStartRef.current.windowY +
			event.clientY -
			dragStartRef.current.pointerY;
		windowPositionRef.current = { x, y };

		if (windowRef.current) {
			windowRef.current.style.transform = `translate3d(${x}px, ${y}px, 0)`;
		}
	}

	function stopDrag(event: PointerEvent<HTMLDivElement>) {
		if (dragStartRef.current) {
			event.currentTarget.releasePointerCapture(event.pointerId);
			dragStartRef.current = null;
			windowRef.current?.classList.remove("is-dragging");
		}
	}

	function nextIdea() {
		setIdeaIndex((current) => (current + 1) % ideas.length);
	}

	function formatMoney(amount: number) {
		return `$${amount.toFixed(amount % 1 === 0 ? 0 : 2)}`;
	}

	function priceRangeForHours(hours: number) {
		const maxPrice = hours * userBudgetPerHour;
		const minPrice = hours === 1 ? 0 : (hours - 1) * userBudgetPerHour + 0.01;

		return `${formatMoney(minPrice)}-${formatMoney(maxPrice)}`;
	}

	function teaseAddressEdit() {
		if (addressTakeoverTimeout.current) {
			window.clearTimeout(addressTakeoverTimeout.current);
			addressTakeoverTimeout.current = null;
		}

		const nextMessage =
			addressBarMessages[addressMessageIndex] ??
			"Why would you do anything but Widget?";

		setAddressMessage(nextMessage);
		setAddressInput(nextMessage);
		setHasAddressEdit(false);
		setAddressMessageIndex(
			(current) => (current + 1) % addressBarMessages.length,
		);
	}

	function openGuidesTab() {
		setIsGuidesTabClosing(false);
		setIsGuidesTabOpen(true);
		setActiveTab("guides");
	}

	function openShopTab() {
		setIsShopTabClosing(false);
		setIsShopTabOpen(true);
		setActiveTab("shop");
	}

	function closeGuidesTab() {
		setIsGuidesTabClosing(true);
		setActiveTab("widget");
	}

	function closeShopTab() {
		setIsShopTabClosing(true);
		setActiveTab("widget");
	}

	function openPlatformTab() {
		setIsPlatformTabClosing(false);
		setIsPlatformTabOpen(true);
		setActiveTab("platform");
	}

	function closePlatformTab() {
		setIsPlatformTabClosing(true);
		setActiveTab("widget");
	}

	function editAddress(value: string) {
		setAddressMessage(null);
		setAddressInput(value);
		setHasAddressEdit(true);

		if (addressTakeoverTimeout.current) {
			window.clearTimeout(addressTakeoverTimeout.current);
		}

		addressTakeoverTimeout.current = window.setTimeout(() => {
			teaseAddressEdit();
		}, 900);
	}

	function stopNyanSound() {
		if (nyanAudioRef.current) {
			nyanAudioRef.current.pause();
			nyanAudioRef.current.currentTime = 0;
		}
	}

	function startNyanSound() {
		stopNyanSound();

		if (!nyanAudioRef.current) {
			const audio = new Audio("/nyan-cat.mp3");
			audio.loop = true;
			nyanAudioRef.current = audio;
		}

		void nyanAudioRef.current.play();
	}

	const dismissAlreadyHere = useCallback(() => {
		setAlreadyHereFading(true);
		alreadyHereTimeout.current = window.setTimeout(() => {
			setShowAlreadyHere(false);
			setAlreadyHereFading(false);
		}, 260);
	}, []);

	function handleGoClick() {
		if (alreadyHereTimeout.current) {
			window.clearTimeout(alreadyHereTimeout.current);
		}
		setAlreadyHereFading(false);
		setShowAlreadyHere(true);
		alreadyHereTimeout.current = window.setTimeout(() => {
			dismissAlreadyHere();
		}, 2000);
	}

	useEffect(() => {
		if (!showAlreadyHere) {
			return;
		}

		function handleOutsideClick(event: MouseEvent) {
			if (
				goButtonWrapRef.current &&
				!goButtonWrapRef.current.contains(event.target as Node)
			) {
				if (alreadyHereTimeout.current) {
					window.clearTimeout(alreadyHereTimeout.current);
				}
				dismissAlreadyHere();
			}
		}

		document.addEventListener("mousedown", handleOutsideClick);
		return () => document.removeEventListener("mousedown", handleOutsideClick);
	}, [showAlreadyHere, dismissAlreadyHere]);

	function toggleEasterEgg() {
		if (isEasterEggOpen) {
			stopNyanSound();
		} else {
			startNyanSound();
		}

		setIsEasterEggOpen((current) => !current);
	}

	function updateProjectForm<Field extends keyof ProjectFormState>(
		field: Field,
		value: ProjectFormState[Field],
	) {
		setProjectForm((current) => ({
			...current,
			[field]: value,
		}));
	}

	function submitProject(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		createProject.mutate(projectForm);
	}

	return (
		<main className="retro-desktop min-h-screen overflow-hidden p-3 text-[#050505] sm:p-6">
			<nav aria-label="Wonderous OS apps" className="desktop-icons">
				<button onClick={() => setActiveTab("widget")} type="button">
					<span>W</span>
					Widget
				</button>
				<button onClick={openGuidesTab} type="button">
					<span>?</span>
					Guides
				</button>
				<button onClick={openShopTab} type="button">
					<span>$</span>
					Shop
				</button>
				<button onClick={openPlatformTab} type="button">
					<span>↗</span>
					Ship
				</button>
			</nav>

			<div className="os-shell mx-auto max-w-7xl">
				<div className="retro-window" ref={windowRef}>
					<header>
						<div
							className="title-bar"
							onPointerCancel={stopDrag}
							onPointerDown={startDrag}
							onPointerMove={dragWindow}
							onPointerUp={stopDrag}
						>
							<div className="flex min-w-0 items-center gap-2">
								<span className="app-icon">W</span>
								<span className="truncate font-bold">
									Widget Explorer - Hack Club
								</span>
							</div>
							<div aria-hidden="true" className="window-controls">
								<span>_</span>
								<span>□</span>
								<span>x</span>
							</div>
						</div>

						{shouldShowTabBar ? (
							<div
								className={`browser-tabs ${
									isTabBarClosing ? "is-closing" : ""
								}`}
								role="tablist"
							>
								<button
									aria-selected={activeTab === "widget"}
									className={`browser-tab ${activeTab === "widget" ? "active" : ""}`}
									onClick={() => setActiveTab("widget")}
									role="tab"
									type="button"
								>
									Widget
								</button>
								{isGuidesTabOpen ? (
									<div
										className={`browser-tab browser-tab-with-close ${
											activeTab === "guides" ? "active" : ""
										}`}
									>
										<button
											aria-selected={activeTab === "guides"}
											onClick={() => setActiveTab("guides")}
											role="tab"
											type="button"
										>
											Guides
										</button>
										<button
											aria-label="Close Guides tab"
											className="tab-close"
											onClick={closeGuidesTab}
											type="button"
										>
											x
										</button>
									</div>
								) : null}
								{isShopTabOpen ? (
									<div
										className={`browser-tab browser-tab-with-close ${
											activeTab === "shop" ? "active" : ""
										}`}
									>
										<button
											aria-selected={activeTab === "shop"}
											onClick={() => setActiveTab("shop")}
											role="tab"
											type="button"
										>
											Shop
										</button>
										<button
											aria-label="Close Shop tab"
											className="tab-close"
											onClick={closeShopTab}
											type="button"
										>
											x
										</button>
									</div>
								) : null}
								{isPlatformTabOpen ? (
									<div
										className={`browser-tab browser-tab-with-close ${
											activeTab === "platform" ? "active" : ""
										}`}
									>
										<button
											aria-selected={activeTab === "platform"}
											onClick={() => setActiveTab("platform")}
											role="tab"
											type="button"
										>
											Platform
										</button>
										<button
											aria-label="Close Platform tab"
											className="tab-close"
											onClick={closePlatformTab}
											type="button"
										>
											x
										</button>
									</div>
								) : null}
							</div>
						) : null}

						<div className="browser-toolbar">
							<div className="address-row">
								<span className="hidden shrink-0 sm:block">Address</span>
								<label
									className={`address-box ${
										addressMessage ? "address-box-message" : ""
									}`}
								>
									<span className="address-lock">★</span>
									<input
										aria-label="Address"
										className="address-input"
										onChange={(event) => editAddress(event.target.value)}
										onFocus={(event) => event.currentTarget.select()}
										onKeyDown={(event) => {
											if (event.key === "Enter") {
												event.preventDefault();
												teaseAddressEdit();
											}
										}}
										readOnly={Boolean(addressMessage)}
										value={addressInput}
									/>
								</label>
								<div className="go-button-wrap" ref={goButtonWrapRef}>
									<button
										className="go-button"
										onClick={handleGoClick}
										type="button"
									>
										Go
									</button>
									{showAlreadyHere ? (
										<div
											aria-live="polite"
											className={`go-tooltip${alreadyHereFading ? "go-tooltip-fade" : ""}`}
										>
											you&rsquo;re already here!
										</div>
									) : null}
								</div>
							</div>
							<div aria-hidden="true" className="extension-anchor">
								<span className="extension-button">W</span>
							</div>
						</div>
					</header>

					<section className="page-stage">
						<div className="site-layout">
							{activeTab === "guides" ? (
								<div className="main-canvas guides-tab-page">
									<section className="guides-intro">
										<span>start here</span>
										<strong>Extension maker guidebook</strong>
									</section>
									<div className="guide-track-grid">
										{guideTracks.map((track) => (
											<section className="guide-track" key={track.title}>
												<h2>{track.title}</h2>
												<ol>
													{track.steps.map((step) => (
														<li key={step}>{step}</li>
													))}
												</ol>
											</section>
										))}
									</div>
									<section className="starter-guides">
										<h2>Starter extension ideas</h2>
										<div>
											{starterGuides.map((guide) => (
												<article key={guide.name}>
													<strong>{guide.name}</strong>
													<p>{guide.description}</p>
												</article>
											))}
										</div>
									</section>
								</div>
							) : activeTab === "shop" ? (
								<div className="main-canvas shop-tab-page">
									<section className="shop-intro">
										<span>shop</span>
										<strong>Pick your web-builder reward</strong>
										<p>
											Ship Widget, then choose browser gear, desk tools, or web
											credits from the prize shop.
										</p>
									</section>
									<section
										aria-label="Shop pricing"
										className="shop-table-wrap"
									>
										<table className="shop-table">
											<thead>
												<tr>
													<th>Reward</th>
													<th>Price range</th>
													<th>Hours</th>
													<th>User budget</th>
													<th>Gross</th>
													<th>Profit</th>
												</tr>
											</thead>
											<tbody>
												{prizeCards.map((prize) => (
													<tr key={`${prize.category}-${prize.title}`}>
														<th scope="row">
															<span>{prize.category}</span>
															<strong>{prize.title}</strong>
														</th>
														<td>{priceRangeForHours(prize.hours)}</td>
														<td>{prize.hours}h</td>
														<td>
															{formatMoney(prize.hours * userBudgetPerHour)}
														</td>
														<td>{formatMoney(prize.hours * hourlyEarnings)}</td>
														<td>{formatMoney(prize.hours * profitPerHour)}</td>
													</tr>
												))}
											</tbody>
										</table>
									</section>
								</div>
							) : activeTab === "platform" ? (
								<div className="main-canvas platform-tab-page">
									<section className="platform-hero">
										<div>
											<span>ship desk</span>
											<h2>Submit your Widget project</h2>
											<p>
												Sign in with Hack Club, save your playable demo,
												codebase, screenshot, and review notes in one secure
												workspace.
											</p>
										</div>
										{session ? (
											<div className="platform-user">
												<span>signed in</span>
												<strong>{session.user.name}</strong>
												{session.user.email ? (
													<small>{session.user.email}</small>
												) : null}
												<form action="/api/auth/logout" method="post">
													<button type="submit">sign out</button>
												</form>
											</div>
										) : (
											<a className="platform-login" href="/api/auth/login">
												sign in with Hack Club
											</a>
										)}
									</section>

									{session ? (
										<div className="project-workspace">
											<form className="project-form" onSubmit={submitProject}>
												<div className="project-form-head">
													<span>new project</span>
													<strong>Project basics</strong>
												</div>
												<label>
													Project name
													<input
														maxLength={80}
														minLength={2}
														onChange={(event) =>
															updateProjectForm("name", event.target.value)
														}
														required
														value={projectForm.name}
													/>
												</label>
												<div className="project-field-grid">
													<label>
														Playable URL
														<input
															onChange={(event) =>
																updateProjectForm(
																	"playableUrl",
																	event.target.value,
																)
															}
															placeholder="https://..."
															required
															type="url"
															value={projectForm.playableUrl}
														/>
													</label>
													<label>
														Codebase URL
														<input
															onChange={(event) =>
																updateProjectForm(
																	"codebaseUrl",
																	event.target.value,
																)
															}
															placeholder="https://github.com/..."
															required
															type="url"
															value={projectForm.codebaseUrl}
														/>
													</label>
												</div>
												<label>
													Screenshot URL
													<input
														onChange={(event) =>
															updateProjectForm(
																"screenshotUrl",
																event.target.value,
															)
														}
														placeholder="https://..."
														type="url"
														value={projectForm.screenshotUrl}
													/>
												</label>
												<label>
													What did you build?
													<textarea
														maxLength={700}
														minLength={20}
														onChange={(event) =>
															updateProjectForm(
																"description",
																event.target.value,
															)
														}
														required
														rows={4}
														value={projectForm.description}
													/>
												</label>
												<label>
													Hack Club review notes
													<textarea
														maxLength={700}
														minLength={10}
														onChange={(event) =>
															updateProjectForm(
																"hackClubInfo",
																event.target.value,
															)
														}
														placeholder="hours spent, eligibility notes, Slack handle, special review context"
														required
														rows={3}
														value={projectForm.hackClubInfo}
													/>
												</label>
												<div className="project-submit-row">
													<label className="status-select">
														Status
														<select
															onChange={(event) =>
																updateProjectForm(
																	"status",
																	event.target.value as ProjectStatus,
																)
															}
															value={projectForm.status}
														>
															<option value="draft">Draft</option>
															<option value="submitted">Submitted</option>
														</select>
													</label>
													<button
														disabled={createProject.isPending}
														type="submit"
													>
														{createProject.isPending
															? "saving..."
															: "save project"}
													</button>
												</div>
												{createProject.error ? (
													<p className="form-error">
														{createProject.error.message}
													</p>
												) : null}
											</form>

											<section className="project-list">
												<div className="project-form-head">
													<span>your builds</span>
													<strong>
														{projectsQuery.data?.length ?? 0} project
														{projectsQuery.data?.length === 1 ? "" : "s"}
													</strong>
												</div>
												{projectsQuery.isLoading ? (
													<p className="project-empty">loading projects...</p>
												) : projectsQuery.data?.length ? (
													<ul>
														{projectsQuery.data.map((project) => (
															<li key={project.id}>
																<div>
																	<span>{project.status}</span>
																	<strong>{project.name}</strong>
																	<p>{project.description}</p>
																</div>
																<div className="project-links">
																	<a href={project.playableUrl}>play</a>
																	<a href={project.codebaseUrl}>code</a>
																	{project.screenshotUrl ? (
																		<a href={project.screenshotUrl}>shot</a>
																	) : null}
																</div>
															</li>
														))}
													</ul>
												) : (
													<p className="project-empty">
														No projects yet. Save your first playable build
														here.
													</p>
												)}
											</section>
										</div>
									) : (
										<section className="platform-locked">
											<strong>Hack Club Auth protects submissions</strong>
											<p>
												Project data is available only after the server verifies
												your Hack Club account and tRPC attaches your session.
											</p>
										</section>
									)}
								</div>
							) : (
								<div className="main-canvas">
									<section className="hero-copy">
										<div className="widget-lockup">
											<h1 className="widget-word">Widget</h1>
											<div
												aria-label="Widget logo"
												className="widget-hero-logo"
												role="img"
											>
												W
											</div>
										</div>
										<p>
											Make a browser extension, ship it, and get free browser
											merch shipped back!
										</p>
										<div className="made-by">
											Made with{" "}
											<span aria-label="love" role="img">
												♥
											</span>{" "}
											by Barnav @ Hack Club
										</div>
									</section>

									<button
										className="platform-entry-button"
										onClick={openPlatformTab}
										type="button"
									>
										<span>Ready to join?</span>
										<strong>Get Started!</strong>
										<span aria-hidden="true" className="platform-entry-arrow">
											→
										</span>
									</button>

									<ul aria-label="Widget steps" className="step-strip">
										<li className="step-item">
											<div className="step-chip">
												<span className="tiny-window" />
												Brainstorm your idea
											</div>
											<div className="panel-content idea-panel">
												<span>idea generator</span>
												<strong>{idea}</strong>
												<button onClick={nextIdea} type="button">
													new idea
												</button>
											</div>
										</li>
										<li className="step-item">
											<div className="step-chip">
												<span className="tiny-window" />
												Develop and Submit
											</div>
											<div className="panel-content guide-panel">
												<span>ship it</span>
												<strong>
													Develop your browser extension and submit for review
												</strong>
												<button onClick={openPlatformTab} type="button">
													open platform
												</button>
											</div>
										</li>
										<li className="step-item">
											<div className="step-chip">
												<span className="tiny-window" />
												Get Merch, Prizes, and More!
											</div>
											<div className="panel-content merch-panel">
												<span>shop preview</span>
												<strong>Browse the prize shop</strong>
												<p>
													Find browser merch, sticker packs, web grants, and
													desk gear after you ship.
												</p>
												<ul aria-label="Prize ideas" className="prize-stack">
													{prizeStack.map((prize, index) => (
														<li
															className={`prize-card prize-card-${index + 1}`}
															key={`${prize.category}-${prize.title}`}
														>
															<span>{prize.category}</span>
															<strong>{prize.title}</strong>
															<small>{prize.detail}</small>
														</li>
													))}
												</ul>
												<button onClick={openShopTab} type="button">
													open shop
												</button>
											</div>
										</li>
									</ul>
								</div>
							)}
						</div>
					</section>

					{isEasterEggOpen ? (
						<aside aria-label="Nyan Cat easter egg" className="nyan-drawer">
							<div aria-hidden="true" className="nyan-scene">
								<div className="nyan-rainbow">
									<span />
									<span />
									<span />
									<span />
									<span />
									<span />
								</div>
								<div className="nyan-cat">
									<span className="nyan-body" />
									<span className="nyan-head" />
									<span className="nyan-tail" />
									<span className="nyan-leg nyan-leg-front" />
									<span className="nyan-leg nyan-leg-back" />
								</div>
							</div>
							<strong>nyan mode unlocked</strong>
						</aside>
					) : null}

					{isPunchcardOpen ? (
						<aside
							aria-labelledby="punchcard-title"
							className="punchcard-popup"
						>
							<button
								aria-label="Close Punchcard popup"
								className="punchcard-popup-close"
								onClick={() => setIsPunchcardOpen(false)}
								type="button"
							>
								x
							</button>
							<div className="punchcard-popup-body">
								<span aria-hidden="true" className="punchcard-gold-dot" />
								<h2 id="punchcard-title">Punchcard coming soon</h2>
								<p>
									Earn punches from Barnav YSWS submissions toward bigger
									rewards.
								</p>
							</div>
						</aside>
					) : null}

					<footer className="status-bar">
						<button
							aria-expanded={isPunchcardOpen}
							className="punchcard-status"
							onClick={() => setIsPunchcardOpen((current) => !current)}
							type="button"
						>
							<span aria-hidden="true" className="punchcard-mark" />
							Punchcard Eligible
						</button>
						<nav aria-label="Footer links" className="status-links">
							{footerLinks.map((link) => (
								<a
									href={link.href}
									key={link.label}
									rel="noreferrer"
									target="_blank"
								>
									{link.label}
								</a>
							))}
							<button
								aria-label="Easter egg"
								aria-pressed={isEasterEggOpen}
								onClick={toggleEasterEgg}
								title="nyan mode"
								type="button"
							>
								:)
							</button>
						</nav>
						<span>A YSWS Program by Barnav</span>
					</footer>
				</div>
			</div>
		</main>
	);
}
