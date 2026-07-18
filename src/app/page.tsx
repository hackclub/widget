"use client";

import {
	type ChangeEvent,
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
type PrizeOption = {
	detail: string;
	imageAlt?: string;
	imageSrc?: string;
	mark?: string;
	title: string;
};
type PrizeReward = PrizeOption & {
	options?: PrizeOption[];
};
type PrizeTier = {
	hours: number;
	rewards: PrizeReward[];
};

type ProjectFormState = {
	codebaseUrl: string;
	description: string;
	name: string;
	playableUrl: string;
	screenshotUrl: string;
};

type SubmissionFormState = {
	estimatedHoursSpent: string;
	githubUsername: string;
	hackatimeProjectUrl: string;
};

type PlatformSession = {
	expiresAt: string;
	user: {
		email: string | null;
		id: string;
		name: string;
		slackId: string | null;
	};
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

const prizeTiers: PrizeTier[] = [
	{
		hours: 1,
		rewards: [
			{
				title: "Chrome Extension Store License",
				detail:
					"Covers the cost on publishing on the Chrome Web Store! For free!",
				imageAlt: "Chrome Web Store bag icon",
				imageSrc: "/chrome-webstore-license.png",
			},
			{
				title: "One Key Keychain",
				detail: "A tiny one-key macropad keychain for shortcut energy!",
				imageAlt: "one key macropad keychain. VERY satisfying fidget.",
				imageSrc: "/one-key-macropad.png",
			},
			{
				title: "Small Rubber Duck",
				detail: "A rubber duck. Can't go wrong!",
				imageAlt: "Small rubber duck held in a hand",
				imageSrc: "/small-rubber-duck.jpeg",
			},
		],
	},
	{
		hours: 3,
		rewards: [
			{
				title: "$10 Domain Grant",
				detail: "Put your extension or demo on a real domain.",
				imageAlt: "Domain and hosting provider logos",
				imageSrc: "/domain-grant.png",
			},
			{
				title: "Four Key Macropad",
				detail: "A satisfying four-button macro pad for shortcuts and demos.",
				imageAlt: "a satisfying fidget four key macropad with black keycaps",
				imageSrc: "/four-key-macropad.jpeg",
			},
			{
				title: "Medium Rubber Duck",
				detail: "A medium sized rubber ducky!",
				imageAlt: "Medium rubber duck with size measurements",
				imageSrc: "/medium-rubber-duck.jpeg",
			},
		],
	},
	{
		hours: 10,
		rewards: [
			{
				title: "Logitech G502 Hero",
				detail: "One of the best mice for building, gaming, and productivity.",
				imageAlt: "Logitech G502 Hero mouse",
				imageSrc: "/logitech-g502-hero.jpeg",
				options: [
					{
						title: "Redragon M612 Predator RGB Gaming Mouse",
						detail:
							"The standard for the RGB-Gaming-Mouse fanatic. Works wonders everywhere!",
						imageAlt: "Redragon M612 Predator RGB Gaming Mouse",
						imageSrc: "/redragon-m612-predator.jpeg",
					},
					{
						title: "$30 Mouse Grant",
						detail: "Pick any mouse that fits your setup!",
						mark: "$30",
					},
				],
			},
			{
				title: "Aula S99 Keyboard",
				detail:
					"A full-size, premium-quality, green-and-cream keyboard for your setup.",
				imageAlt: "Aula S99 green and cream keyboard",
				imageSrc: "/aula-s99-keyboard.jpeg",
				options: [
					{
						title: "ONIKUMA Tri-Mode RGB Silent Membrane Keyboard",
						detail:
							"A quiet RGB keyboard with bluetooth, wired, and wireless connection support. Best of all worlds!",
						imageAlt: "ONIKUMA Tri-Mode RGB Silent Membrane Keyboard",
						imageSrc: "/onikuma-tri-mode-keyboard.png",
					},
					{
						title: "$30 Keyboard Grant",
						detail: "Choose a keyboard that matches what you want!",
						mark: "$30",
					},
				],
			},
			{
				title: "TS PMO Shirt",
				detail: "For the real typescript enthusiasts.",
				imageAlt: "White TS PMO shirt",
				imageSrc: "/ts-pmo-shirt.jpeg",
			},
			{
				title: "Gigantic Rubber Duck",
				detail: "A. Gigantic. Rubber. Duck.",
				imageAlt: "Gigantic rubber duck held beside a smiling kid",
				imageSrc: "/gigantic-rubber-duck.jpeg",
			},
		],
	},
	{
		hours: 25,
		rewards: [
			{
				title: "Google Streamer 4K",
				detail: "A 4K Google TV streamer for testing and relaxing.",
				imageAlt: "Google Streamer 4K with remote",
				imageSrc: "/google-streamer-4k.jpeg",
			},
			{
				title: 'Lenovo 11.6" 300e Chromebook',
				detail: "A touchscreen 2-in-1 Chromebook for building anywhere.",
				imageAlt: "Lenovo 300e Chromebook touchscreen 2 in 1",
				imageSrc: "/lenovo-300e-chromebook.jpeg",
			},
			{
				title: "Absolutely Gigantic Blåhaj",
				detail: "An overtly gigantic blåhaj for maximum cutness.",
				imageAlt: "Giant shark plushy held by a kid",
				imageSrc: "/giant-shark-plushy.jpeg",
			},
		],
	},
	{
		hours: 50,
		rewards: [
			{
				title: 'HP Latest Stream 14" HD Laptop',
				detail: "Latest Stream HP laptop for working on the go! FOR FREE!",
				imageAlt: 'White HP Latest Stream 14" HD Laptop',
				imageSrc: "/hp-stream-14-laptop.png",
			},
		],
	},
];

function ShopRewardsTable() {
	const [carouselIndexes, setCarouselIndexes] = useState<
		Record<string, number>
	>({});

	const shiftPrizeOption = (
		key: string,
		totalOptions: number,
		change: number,
	) => {
		setCarouselIndexes((currentIndexes) => {
			const currentIndex = currentIndexes[key] ?? 0;
			return {
				...currentIndexes,
				[key]: (currentIndex + change + totalOptions) % totalOptions,
			};
		});
	};

	useEffect(() => {
		const carouselRewards = prizeTiers.flatMap((tier, tierIndex) =>
			tier.rewards.map((reward, rewardIndex) => ({
				key: `${tier.hours}-${reward.title}`,
				rotationMs: 7600 + tierIndex * 900 + rewardIndex * 1300,
				totalOptions: 1 + (reward.options?.length ?? 0),
			})),
		);
		const intervalIds = carouselRewards
			.filter((reward) => reward.totalOptions > 1)
			.map((reward) =>
				window.setInterval(() => {
					setCarouselIndexes((currentIndexes) => {
						const currentIndex = currentIndexes[reward.key] ?? 0;
						return {
							...currentIndexes,
							[reward.key]: (currentIndex + 1) % reward.totalOptions,
						};
					});
				}, reward.rotationMs),
			);

		return () => {
			for (const intervalId of intervalIds) {
				window.clearInterval(intervalId);
			}
		};
	}, []);

	return (
		<table className="shop-table">
			<thead>
				<tr>
					{prizeTiers.map((tier) => (
						<th key={tier.hours} scope="col">
							<span>{tier.hours}</span>
							<strong>hour{tier.hours === 1 ? "" : "s"}</strong>
						</th>
					))}
				</tr>
			</thead>
			<tbody>
				<tr>
					{prizeTiers.map((tier) => (
						<td key={tier.hours}>
							{tier.rewards.length ? (
								<div className="shop-prize-stack">
									{tier.rewards.map((reward) => {
										const options = [reward, ...(reward.options ?? [])];
										const carouselKey = `${tier.hours}-${reward.title}`;
										const selectedIndex =
											(carouselIndexes[carouselKey] ?? 0) % options.length;
										const selectedReward = options[selectedIndex] ?? reward;

										return (
											<article className="shop-prize-card" key={reward.title}>
												<div className="shop-prize-media">
													{options.length > 1 ? (
														<button
															aria-label={`Previous option for ${reward.title}`}
															className="shop-prize-arrow shop-prize-arrow-prev"
															onClick={() =>
																shiftPrizeOption(
																	carouselKey,
																	options.length,
																	-1,
																)
															}
															type="button"
														>
															←
														</button>
													) : null}
													<div
														className="shop-prize-visual"
														key={selectedReward.title}
													>
														{selectedReward.imageSrc ? (
															// biome-ignore lint/performance/noImgElement: small static prize images keep the app simple.
															<img
																alt={
																	selectedReward.imageAlt ??
																	selectedReward.title
																}
																src={selectedReward.imageSrc}
															/>
														) : (
															<div className="shop-prize-mark">
																{selectedReward.mark ?? "W"}
															</div>
														)}
													</div>
													{options.length > 1 ? (
														<button
															aria-label={`Next option for ${reward.title}`}
															className="shop-prize-arrow shop-prize-arrow-next"
															onClick={() =>
																shiftPrizeOption(carouselKey, options.length, 1)
															}
															type="button"
														>
															→
														</button>
													) : null}
													{options.length > 1 ? (
														<span className="shop-prize-option-count">
															{selectedIndex + 1}/{options.length}
														</span>
													) : null}
												</div>
												<div
													className="shop-prize-copy"
													key={`${selectedReward.title}-copy`}
												>
													<strong>{selectedReward.title}</strong>
													<p>{selectedReward.detail}</p>
												</div>
											</article>
										);
									})}
								</div>
							) : (
								<div className="shop-prize-empty">
									<strong>coming soon</strong>
									<p>More rewards will be added here.</p>
								</div>
							)}
						</td>
					))}
				</tr>
			</tbody>
		</table>
	);
}

const addressBarMessages = [
	"Why would you do anything but Widget?",
	"Nice try. Widget is the whole internet now.",
	"Address rejected. Please return to Widget.",
	"Typing privileges revoked by the Widget council.",
];

const rustImprovementGuide = [
	{
		title: "1. Make the folder",
		steps: [
			"Create a new folder named rust-improvement-engine.",
			"Inside it, create two files: manifest.json and content.js.",
			"Keep both files in the top level of the folder so Chrome can find them.",
		],
	},
	{
		title: "2. Add manifest.json",
		steps: [
			"manifest.json tells Chrome the extension name, version, permissions, and which script should run on web pages.",
			"Use Manifest V3. The content script should run on http and https pages so it can look for the word Rust.",
		],
		code: `{
  "manifest_version": 3,
  "name": "Rust Improvement Engine",
  "version": "1.0.0",
  "description": "Changes every instance of Rust into Blazing Fast.",
  "content_scripts": [
    {
      "matches": ["http://*/*", "https://*/*"],
      "js": ["content.js"]
    }
  ]
}`,
	},
	{
		title: "3. Write content.js",
		steps: [
			"content.js runs inside each matching page.",
			"Use a TreeWalker to visit text nodes only. That avoids breaking buttons, links, images, scripts, and layout.",
			"Replace every exact instance of Rust with Blazing Fast.",
		],
		code: `const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);

let textNode = walker.nextNode();

while (textNode) {
  textNode.nodeValue = textNode.nodeValue.replaceAll("Rust", "Blazing Fast");
  textNode = walker.nextNode();
}`,
	},
	{
		title: "4. Load it in Chrome",
		steps: [
			"Open chrome://extensions.",
			"Turn on Developer mode in the top right.",
			"Click Load unpacked and choose the rust-improvement-engine folder.",
			"Pin the extension if you want, but this extension works automatically on pages.",
		],
	},
	{
		title: "5. Test it on real pages",
		steps: [
			"Open the Rust test page on this site: /rust-test.",
			"Refresh the page after loading the extension.",
			"Confirm Rust becomes Blazing Fast while other page text still works.",
			"Edit content.js, then return to chrome://extensions and click the reload button on the extension before testing again.",
		],
	},
	{
		title: "6. Put your code on GitHub",
		steps: [
			"Make a free GitHub account if you do not already have one.",
			"Create a new public repository named rust-improvement-engine.",
			"Upload manifest.json and content.js to the repository.",
			"Commit the files with a short message like add rust improvement engine.",
			"Copy the repository URL. This is the codebase link you will submit for review.",
		],
	},
	{
		title: "7. Submit for review",
		steps: [
			"Take one screenshot showing the Rust test page after the replacement works.",
			"Submit your GitHub repository URL as the codebase link.",
			"Submit your GitHub repository URL as the playable link too.",
			"Describe your extension in your own words.",
		],
	},
];

function renderGuideStep(step: string) {
	if (!step.includes("/rust-test")) {
		return step;
	}

	const [before, after = ""] = step.split("/rust-test");

	return (
		<>
			{before}
			<a href="/rust-test" rel="noreferrer" target="_blank">
				/rust-test
			</a>
			{after}
		</>
	);
}

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
	name: "",
	playableUrl: "",
	screenshotUrl: "",
};
const keepExistingScreenshotValue = "__widget_keep_existing_screenshot__";

const emptySubmissionForm: SubmissionFormState = {
	estimatedHoursSpent: "",
	githubUsername: "",
	hackatimeProjectUrl: "",
};

const maxScreenshotUploadBytes = 1_000_000;

export default function Home() {
	const utils = api.useUtils();
	const sessionQuery = api.auth.me.useQuery(undefined, {
		refetchOnMount: "always",
		refetchOnWindowFocus: true,
		staleTime: 0,
	});
	const [directSession, setDirectSession] = useState<PlatformSession | null>(
		null,
	);
	const session = directSession ?? sessionQuery.data;
	const projectsQuery = api.projects.listMine.useQuery(undefined, {
		enabled: Boolean(session),
	});
	const createProject = api.projects.create.useMutation({
		onSuccess: async () => {
			setProjectForm(emptyProjectForm);
			setEditingProjectId(null);
			setPreservedScreenshotProjectId(null);
			setActiveProjectMode("create");
			await utils.projects.listMine.invalidate();
		},
	});
	const updateProject = api.projects.update.useMutation({
		onSuccess: async () => {
			setProjectForm(emptyProjectForm);
			setEditingProjectId(null);
			setPreservedScreenshotProjectId(null);
			setActiveProjectMode("create");
			await utils.projects.listMine.invalidate();
		},
	});
	const removeDraftProject = api.projects.removeDraft.useMutation({
		onSuccess: async (_data, variables) => {
			if (editingProjectId === variables.projectId) {
				setProjectForm(emptyProjectForm);
				setEditingProjectId(null);
				setPreservedScreenshotProjectId(null);
				setActiveProjectMode("create");
			}

			if (submittingProjectId === variables.projectId) {
				setSubmittingProjectId(null);
				setSubmissionForm(emptySubmissionForm);
				setActiveProjectMode("create");
			}

			await utils.projects.listMine.invalidate();
		},
	});
	const submitProjectForReview = api.projects.submitForReview.useMutation({
		onSuccess: async () => {
			setActiveProjectMode("create");
			setProjectForm(emptyProjectForm);
			setPreservedScreenshotProjectId(null);
			setSubmittingProjectId(null);
			setSubmissionForm(emptySubmissionForm);
			await utils.projects.listMine.invalidate();
		},
	});
	const [activeTab, setActiveTab] = useState<BrowserTab>("widget");
	const [projectForm, setProjectForm] =
		useState<ProjectFormState>(emptyProjectForm);
	const [screenshotUploadError, setScreenshotUploadError] = useState<
		string | null
	>(null);
	const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
	const [preservedScreenshotProjectId, setPreservedScreenshotProjectId] =
		useState<string | null>(null);
	const [activeProjectMode, setActiveProjectMode] = useState<
		"create" | "edit" | "submission" | "view"
	>("create");
	const [submittingProjectId, setSubmittingProjectId] = useState<string | null>(
		null,
	);
	const [submissionForm, setSubmissionForm] =
		useState<SubmissionFormState>(emptySubmissionForm);
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
	const dragStartRef = useRef<WindowDragStart | null>(null);
	const [showAlreadyHere, setShowAlreadyHere] = useState(false);
	const [alreadyHereFading, setAlreadyHereFading] = useState(false);
	const submittingProject = projectsQuery.data?.find((project) => {
		return project.id === submittingProjectId;
	});
	const isPreservingUploadedScreenshot =
		Boolean(editingProjectId) &&
		preservedScreenshotProjectId === editingProjectId &&
		projectForm.screenshotUrl === "";
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

	const refreshDirectSession = useCallback(async () => {
		try {
			const response = await fetch("/api/auth/me", {
				cache: "no-store",
				credentials: "include",
				headers: {
					accept: "application/json",
				},
			});
			const contentType = response.headers.get("content-type") ?? "";

			if (!response.ok || !contentType.includes("application/json")) {
				console.error("Direct auth session lookup failed.", {
					contentType,
					status: response.status,
				});
				setDirectSession(null);
				return;
			}

			setDirectSession((await response.json()) as PlatformSession | null);
		} catch (error) {
			console.error("Direct auth session lookup crashed.", error);
			setDirectSession(null);
		}
	}, []);

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

		if (params.get("auth") === "success") {
			void refreshDirectSession();
			void utils.auth.me.invalidate().then(() => sessionQuery.refetch());
			params.delete("auth");

			const nextSearch = params.toString();
			window.history.replaceState(
				null,
				"",
				`${window.location.pathname}${nextSearch ? `?${nextSearch}` : ""}`,
			);
		}
	}, [refreshDirectSession, sessionQuery.refetch, utils.auth.me]);

	useEffect(() => {
		void refreshDirectSession();
	}, [refreshDirectSession]);

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
		if (field === "screenshotUrl") {
			setScreenshotUploadError(null);
			setPreservedScreenshotProjectId(null);
		}

		setProjectForm((current) => ({
			...current,
			[field]: value,
		}));
	}

	function isUploadedScreenshot(value: string) {
		return /^data:image\/(?:png|jpe?g|webp|gif);base64,/i.test(value);
	}

	function uploadScreenshot(event: ChangeEvent<HTMLInputElement>) {
		const file = event.target.files?.[0];
		event.target.value = "";

		if (!file) {
			return;
		}

		if (!file.type.startsWith("image/")) {
			setScreenshotUploadError("Upload a PNG, JPG, GIF, or WebP image.");
			return;
		}

		if (file.size > maxScreenshotUploadBytes) {
			setScreenshotUploadError("Screenshot uploads must be smaller than 1 MB.");
			return;
		}

		const reader = new FileReader();
		reader.addEventListener("load", () => {
			if (typeof reader.result !== "string") {
				setScreenshotUploadError("Could not read that screenshot.");
				return;
			}

			setScreenshotUploadError(null);
			updateProjectForm("screenshotUrl", reader.result);
		});
		reader.addEventListener("error", () => {
			setScreenshotUploadError("Could not read that screenshot.");
		});
		reader.readAsDataURL(file);
	}

	function updateSubmissionForm<Field extends keyof SubmissionFormState>(
		field: Field,
		value: SubmissionFormState[Field],
	) {
		setSubmissionForm((current) => ({
			...current,
			[field]: value,
		}));
	}

	function submitProject(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();

		if (editingProjectId && activeProjectMode === "edit") {
			updateProject.mutate({
				...projectForm,
				projectId: editingProjectId,
				screenshotUrl:
					preservedScreenshotProjectId === editingProjectId &&
					projectForm.screenshotUrl === ""
						? keepExistingScreenshotValue
						: projectForm.screenshotUrl,
				status: "draft",
			});
			return;
		}

		createProject.mutate({
			...projectForm,
			status: "draft",
		});
	}

	function editProject(project: {
		codebaseUrl: string;
		description: string;
		id: string;
		name: string;
		playableUrl: string;
		hasUploadedScreenshot?: boolean;
		screenshotUrl: string | null;
	}) {
		setEditingProjectId(project.id);
		setSubmittingProjectId(null);
		setActiveProjectMode("edit");
		setScreenshotUploadError(null);
		setPreservedScreenshotProjectId(
			project.hasUploadedScreenshot ? project.id : null,
		);
		setProjectForm({
			codebaseUrl: project.codebaseUrl,
			description: project.description,
			name: project.name,
			playableUrl: project.playableUrl,
			screenshotUrl: project.screenshotUrl ?? "",
		});
	}

	function viewProject(project: {
		codebaseUrl: string;
		description: string;
		id: string;
		name: string;
		playableUrl: string;
		hasUploadedScreenshot?: boolean;
		screenshotUrl: string | null;
	}) {
		setEditingProjectId(project.id);
		setSubmittingProjectId(null);
		setActiveProjectMode("view");
		setScreenshotUploadError(null);
		setPreservedScreenshotProjectId(
			project.hasUploadedScreenshot ? project.id : null,
		);
		setProjectForm({
			codebaseUrl: project.codebaseUrl,
			description: project.description,
			name: project.name,
			playableUrl: project.playableUrl,
			screenshotUrl: project.screenshotUrl ?? "",
		});
	}

	function resetProjectForm() {
		setEditingProjectId(null);
		setActiveProjectMode("create");
		setPreservedScreenshotProjectId(null);
		setSubmittingProjectId(null);
		setProjectForm(emptyProjectForm);
		setSubmissionForm(emptySubmissionForm);
		setScreenshotUploadError(null);
	}

	function startProjectSubmission(projectId: string) {
		setEditingProjectId(null);
		setActiveProjectMode("submission");
		setSubmittingProjectId(projectId);
		setProjectForm(emptyProjectForm);
		setSubmissionForm(emptySubmissionForm);
		setScreenshotUploadError(null);
	}

	function removeProject(projectId: string, projectName: string) {
		if (!window.confirm(`Remove "${projectName}" from your builds?`)) {
			return;
		}

		removeDraftProject.mutate({ projectId });
	}

	function projectStatusLabel(status: string) {
		if (status === "draft") {
			return "not submitted";
		}

		if (status === "pending") {
			return "submitted - final";
		}

		return status.replace("_", " ");
	}

	function submitProjectForFinalReview(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();

		if (!submittingProjectId) {
			return;
		}

		submitProjectForReview.mutate({
			estimatedHoursSpent: Number(submissionForm.estimatedHoursSpent),
			githubUsername: submissionForm.githubUsername,
			hackatimeProjectUrl: submissionForm.hackatimeProjectUrl,
			projectId: submittingProjectId,
		});
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
										<strong>Build Your First Extension!</strong>
										<p>
											This is the Rust Improvement Engine - a basic extension
											that changes every instance of the word "Rust" into
											"Blazing Fast".
										</p>
									</section>
									<section className="starter-guides written-guide">
										<h2>Full written guide</h2>
										<div>
											{rustImprovementGuide.map((section) => (
												<article key={section.title}>
													<strong>{section.title}</strong>
													<ol>
														{section.steps.map((step) => (
															<li key={step}>{renderGuideStep(step)}</li>
														))}
													</ol>
													{"code" in section ? (
														<pre>
															<code>{section.code}</code>
														</pre>
													) : null}
												</article>
											))}
										</div>
									</section>
								</div>
							) : activeTab === "shop" ? (
								<div className="main-canvas shop-tab-page">
									<section className="shop-intro">
										<span>shop</span>
										<strong>Pick your build-hours reward</strong>
										<p>
											Ship Widget, log your Hackatime hours, then choose from
											clean browser-builder rewards.
										</p>
									</section>
									<section
										aria-label="Shop prizes by hours"
										className="shop-table-wrap"
									>
										<ShopRewardsTable />
									</section>
									<section aria-label="Shop FAQ" className="shop-faq">
										<div className="shop-faq-head">
											<span>faq</span>
											<strong>Before you pick a prize</strong>
										</div>
										<div className="shop-faq-grid">
											<article>
												<strong>Is this actually free?</strong>
												<p>
													Yes. Build and submit a real browser extension, get it
													reviewed, and your approved hours unlock prizes at no
													cost to you.
												</p>
											</article>
											<article>
												<strong>How do hours work?</strong>
												<p>
													Hours come from the Hackatime project you submit with
													your extension. Pick the tier at or below your
													approved hours.
												</p>
											</article>
											<article>
												<strong>When do I choose?</strong>
												<p>
													After your project is reviewed, you will be able to
													choose from the rewards available for your hour tier.
												</p>
											</article>
											<article>
												<strong>Can I swap later?</strong>
												<p>
													Ask in{" "}
													<a href="https://hackclub.slack.com/archives/C08MUA0LGEV">
														#widget
													</a>{" "}
													or let the fulfiller know before it ships. Once it is
													shipped, prize choices are final.
												</p>
											</article>
										</div>
									</section>
								</div>
							) : activeTab === "platform" ? (
								<div className="main-canvas platform-tab-page">
									<section
										className={`platform-hero ${
											session ? "" : "platform-hero-signed-out"
										}`}
									>
										<div>
											<h2>Widget Platform</h2>
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
										) : null}
									</section>

									{session ? (
										<div className="project-workspace">
											<form
												className="project-form"
												onSubmit={
													activeProjectMode === "submission"
														? submitProjectForFinalReview
														: submitProject
												}
											>
												<div
													className={`project-form-head ${
														activeProjectMode !== "create" &&
														activeProjectMode !== "submission"
															? "project-form-head-with-action"
															: ""
													}`}
												>
													<strong>
														{activeProjectMode === "submission" ? (
															<>
																Final submission for{" "}
																<em className="project-editing-word">
																	{submittingProject?.name ?? "this project"}
																</em>
															</>
														) : activeProjectMode === "view" ? (
															"Submission Details"
														) : activeProjectMode === "edit" ? (
															<>
																<em className="project-editing-word">
																	Editing
																</em>{" "}
																an Extension Project
															</>
														) : (
															"Make a New Extension Project"
														)}
													</strong>
													{activeProjectMode !== "create" &&
													activeProjectMode !== "submission" ? (
														<button onClick={resetProjectForm} type="button">
															new project
														</button>
													) : null}
												</div>
												{activeProjectMode === "submission" ? (
													<>
														<p className="project-form-note">
															Name, email, birthdate, Slack ID, and shipping
															address are pulled from Hack Club Auth. Submitting
															is final.
														</p>
														<label>
															GitHub Username
															<input
																onChange={(event) =>
																	updateSubmissionForm(
																		"githubUsername",
																		event.target.value,
																	)
																}
																required
																value={submissionForm.githubUsername}
															/>
														</label>
														<label>
															Estimated Hours Spent
															<input
																min="0.25"
																onChange={(event) =>
																	updateSubmissionForm(
																		"estimatedHoursSpent",
																		event.target.value,
																	)
																}
																required
																step="0.25"
																type="number"
																value={submissionForm.estimatedHoursSpent}
															/>
														</label>
														<label>
															Hackatime Project URL
															<input
																inputMode="url"
																onChange={(event) =>
																	updateSubmissionForm(
																		"hackatimeProjectUrl",
																		event.target.value,
																	)
																}
																pattern="^(https?:\/\/)?hackatime\.hackclub\.com\/.+"
																placeholder="https://hackatime.hackclub.com/..."
																required
																title="Enter a hackatime.hackclub.com project URL"
																type="text"
																value={submissionForm.hackatimeProjectUrl}
															/>
														</label>
														<div className="project-review-actions">
															<button onClick={resetProjectForm} type="button">
																cancel
															</button>
															<button
																disabled={submitProjectForReview.isPending}
																type="submit"
															>
																{submitProjectForReview.isPending
																	? "submitting..."
																	: "submit final"}
															</button>
														</div>
													</>
												) : (
													<>
														<label>
															Extension name
															<input
																disabled={activeProjectMode === "view"}
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
																	disabled={activeProjectMode === "view"}
																	inputMode="url"
																	onChange={(event) =>
																		updateProjectForm(
																			"playableUrl",
																			event.target.value,
																		)
																	}
																	placeholder="https://github.com/..."
																	required
																	type="text"
																	value={projectForm.playableUrl}
																/>
																<small>
																	Usually your codebase if you're not published.
																</small>
															</label>
															<label>
																Codebase URL
																<input
																	disabled={activeProjectMode === "view"}
																	inputMode="url"
																	onChange={(event) =>
																		updateProjectForm(
																			"codebaseUrl",
																			event.target.value,
																		)
																	}
																	placeholder="https://github.com/..."
																	required
																	type="text"
																	value={projectForm.codebaseUrl}
																/>
																<small>
																	GitHub URL, GitLab URL, BitBucket URL, etc.
																</small>
															</label>
														</div>
														<label>
															Screenshot URL
															<input
																disabled={activeProjectMode === "view"}
																inputMode="url"
																onChange={(event) =>
																	updateProjectForm(
																		"screenshotUrl",
																		event.target.value,
																	)
																}
																placeholder={
																	isPreservingUploadedScreenshot ||
																	isUploadedScreenshot(
																		projectForm.screenshotUrl,
																	)
																		? "uploaded screenshot saved"
																		: "https://..."
																}
																type="text"
																value={
																	isUploadedScreenshot(
																		projectForm.screenshotUrl,
																	)
																		? ""
																		: projectForm.screenshotUrl
																}
															/>
															<small>
																Paste an image URL or upload a PNG, JPG, GIF, or
																WebP under 1 MB.
															</small>
															{isPreservingUploadedScreenshot ? (
																<small>Uploaded screenshot saved.</small>
															) : null}
															{activeProjectMode !== "view" ? (
																<div className="screenshot-upload-row">
																	<input
																		accept="image/png,image/jpeg,image/gif,image/webp"
																		onChange={uploadScreenshot}
																		type="file"
																	/>
																	{isPreservingUploadedScreenshot ||
																	isUploadedScreenshot(
																		projectForm.screenshotUrl,
																	) ? (
																		<button
																			onClick={() => {
																				setPreservedScreenshotProjectId(null);
																				updateProjectForm("screenshotUrl", "");
																			}}
																			type="button"
																		>
																			remove upload
																		</button>
																	) : null}
																</div>
															) : null}
															{screenshotUploadError ? (
																<small className="form-error">
																	{screenshotUploadError}
																</small>
															) : null}
															{isUploadedScreenshot(
																projectForm.screenshotUrl,
															) ? (
																// biome-ignore lint/performance/noImgElement: data-url upload previews cannot be optimized by next/image.
																<img
																	alt="Uploaded screenshot preview"
																	className="screenshot-preview"
																	src={projectForm.screenshotUrl}
																/>
															) : null}
														</label>
														<label>
															What did you build?
															<textarea
																disabled={activeProjectMode === "view"}
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
														{activeProjectMode !== "view" ? (
															<div className="project-submit-row">
																<button
																	disabled={
																		createProject.isPending ||
																		updateProject.isPending
																	}
																	type="submit"
																>
																	{createProject.isPending ||
																	updateProject.isPending
																		? "saving..."
																		: editingProjectId
																			? "Save Changes"
																			: "+ Add Project"}
																</button>
															</div>
														) : null}
													</>
												)}
												{createProject.error ? (
													<p className="form-error">
														{createProject.error.message}
													</p>
												) : null}
												{submitProjectForReview.error &&
												activeProjectMode === "submission" ? (
													<p className="form-error">
														{submitProjectForReview.error.message}
													</p>
												) : null}
												{removeDraftProject.error ? (
													<p className="form-error">
														{removeDraftProject.error.message}
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
																	<span>
																		{projectStatusLabel(project.status)}
																	</span>
																	<strong>{project.name}</strong>
																	<p>{project.description}</p>
																</div>
																<div className="project-actions">
																	<div className="project-links">
																		{project.status === "draft" ? (
																			<button
																				disabled={
																					submitProjectForReview.isPending
																				}
																				onClick={() =>
																					startProjectSubmission(project.id)
																				}
																				type="button"
																			>
																				submit
																				<span aria-hidden="true">→</span>
																			</button>
																		) : (
																			<button
																				onClick={() => viewProject(project)}
																				type="button"
																			>
																				view
																			</button>
																		)}
																		<button
																			disabled={project.status !== "draft"}
																			onClick={() => editProject(project)}
																			type="button"
																		>
																			edit
																		</button>
																		{project.status === "draft" ? (
																			<button
																				className="project-remove-button"
																				disabled={removeDraftProject.isPending}
																				onClick={() =>
																					removeProject(
																						project.id,
																						project.name,
																					)
																				}
																				type="button"
																			>
																				remove
																			</button>
																		) : null}
																	</div>
																</div>
																{project.status !== "draft" ? (
																	<small className="project-support-note">
																		Submitted projects are final. Need help? Ask
																		in{" "}
																		<a href="https://hackclub.slack.com/archives/C08MUA0LGEV">
																			#widget
																		</a>{" "}
																		on Slack.
																	</small>
																) : null}
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
											<form action="/api/auth/login" method="get">
												<button className="platform-login" type="submit">
													sign in with Hack Club
												</button>
											</form>
										</section>
									)}
								</div>
							) : (
								<div className="main-canvas home-tab-page">
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
												Get Merch, Prizes, & More!
											</div>
											<div className="panel-content merch-panel">
												<span>shop preview</span>
												<strong>Browse the prize shop</strong>
												<p>
													Browser merch, sticker packs, web grants, and desk
													gear — yours after you ship.
												</p>
												<button
													className="shop-cta-button"
													onClick={openShopTab}
													type="button"
												>
													View the Shop →
												</button>
											</div>
										</li>
									</ul>
									<div className="eligibility-strip">
										<div>
											<span>eligible builds</span>
											<strong>
												Chrome, Firefox, and any browser extension or widget
												counts.
											</strong>
										</div>
										<div>
											<span>deadline</span>
											<strong>July 31</strong>
										</div>
									</div>
									<section
										aria-label="Shop preview"
										className="landing-shop-preview"
									>
										<div className="landing-shop-preview-head">
											<span>shop preview</span>
											<strong>Rewards by build hours</strong>
										</div>
										<div className="shop-table-wrap">
											<ShopRewardsTable />
										</div>
									</section>
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
								<h2 id="punchcard-title">Punchcard is lurking</h2>
								<p>
									Some Widget ships may count toward something later. Keep
									building.
								</p>
							</div>
						</aside>
					) : null}

					<div className="support-banner">
						<span aria-hidden="true">★</span>
						Need help?{" "}
						<a
							href="https://hackclub.enterprise.slack.com/archives/C0BHJB5HXUJ"
							rel="noreferrer"
							target="_blank"
						>
							Ask in <strong>#widget</strong> on Slack
						</a>
						<span aria-hidden="true"> →</span>
					</div>
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
