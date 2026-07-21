/* All site content lives here. To add an entry, append an object to the
   relevant array — the page renders everything in js/main.js.
   Set hidden: true on any entry to keep it in the file but off the page. */

const SITE = {
  name: "Vedant Palit",
  photo: "images/vp_c.jpg",
  photoFull: "images/vp.jpg",
  /* Which toy to show under the portrait: "attention" or "collab" */
  widget: "attention",
  /* Updates layout: "axis" (horizontal) or "timeline" (vertical, collapsible years) */
  updates: "axis",
  /* Default sentence for the attention toy (visitors can type their own) */
  sentence: "When Vedant reads, Vedant thinks",

  /* Current positions, shown as small rows under the portrait.
     Keep org names short so rows fit the portrait width; put the
     full name in title (shown on hover). Empty array hides the block. */
  current: [
    { role: "Guest Researcher", org: "MPI for Intelligent Systems, EI", url: "https://is.mpg.de/ei", title: "Max Planck Institute for Intelligent Systems, Empirical Inference Department" },
    { role: "Research Lead", org: "EuroSafe AI", url: "https://safe.eu/team" },
    { role: "Researcher", org: "Jinesis Lab, UofT", url: "https://zhijing-jin.com/home/", title: "Jinesis Lab, University of Toronto" }
  ],
  bio: [
    'I am a researcher based in Tübingen, Germany, at the <a href="https://is.mpg.de/ei">Empirical Inference department</a> of the Max Planck Institute for Intelligent Systems, where I work with <a href="https://is.mpg.de/~bs">Dr. Bernhard Schölkopf</a> and, jointly, with <a href="https://zhijing-jin.com/home/">Dr. Zhijing Jin</a> of the Jinesis Lab (University of Toronto &amp; Vector Institute). I recently graduated from <a href="https://www.iitkgp.ac.in/">IIT Kharagpur</a> with a BTech in Industrial &amp; Systems Engineering and an MTech in Financial Engineering.',
    'I am interested in machine and deep learning, particularly in the interpretability of AI models. I have been working primarily on mechanistic interpretability and its application in developing models with improved and trustworthy reasoning capabilities. During my undergrad, I had the opportunity to work with <a href="https://debabrota-basu.github.io/">Dr. Debabrota Basu</a> at University of Lille, members of <a href="https://health-nlp.com/people/carsten">Dr. Carsten Eickhoff</a>’s and <a href="https://ritambharasingh.com/">Dr. Ritambhara Singh</a>’s groups at the University of Tübingen and Brown University, and <a href="https://manasgaur.github.io/">Dr. Manas Gaur</a> at UMBC.',
    'I also enjoy quizzing, reading science fiction books and watching anime and movies of almost every genre.',
    'Feel free to drop me an e-mail if you want to chat with me!'
  ],
  links: [
    {
      label: "Email",
      options: [
        { label: "MPI Tübingen", url: "mailto:vedant.palit@tuebingen.mpg.de" },
        { label: "UofT", url: "mailto:vedantpalit@cs.toronto.edu" }
      ]
    },
    { label: "CV", url: "images/Vedant_Palit_C_V_web.pdf" },
    { label: "Scholar", url: "https://scholar.google.com/citations?hl=en&user=aUL2jngAAAAJ" },
    { label: "Blog", url: "https://medium.com/@vedantpalit10" },
    { label: "GitHub", url: "https://github.com/vedantpalit" }
  ]
};

/* type colors the timeline dot: paper (red), position (blue),
   award (amber), milestone (gray) */
const UPDATES = [
  { date: "Jul '26", type: "position", text: "Started as a <strong>Guest Researcher</strong> at the <strong>Max Planck Institute for Intelligent Systems, Tübingen</strong>." },
  { date: "Jun '26", type: "award", text: "Our paper <strong>“Simulating Eutopia: Revisiting Long-term Fairness with Outcomes, Performativity, and Dynamics”</strong> received a <strong>Spotlight at ECAF 2026</strong> (extended abstract) and was accepted to the <strong>ICML AI4LAW Workshop 2026</strong>." },
  { date: "Jan '26", type: "position", text: "Started as a <strong>Researcher</strong> at the <strong>Jinesis Lab, University of Toronto and Vector Institute</strong>." },
  { date: "Jul '25", type: "position", text: "Interned at <strong>JP Morgan and Chase</strong> in the Model Risk and Governance Review Division from May to July 2025." },
  { date: "May '25", type: "paper", text: "Our paper <strong>“Forgotten Polygons: Multimodal Large Language Models are Shape-Blind”</strong> has been accepted to <strong>ACL Findings 2025</strong>." },
  { date: "Jan '25", type: "paper", text: "Our paper <strong>“What Do VLMs NOTICE? A Mechanistic Interpretability Pipeline for Noise-free Text-Image Corruption and Evaluation”</strong> has been accepted to <strong>NAACL 2025</strong>." },
  { date: "Dec '24", type: "award", text: "Led the team of IIT Kharagpur to Gold at <strong>Adobe Image Classification Challenge</strong> (Inter IIT Tech Meet 2024)." },
  { date: "Sep '24", type: "paper", text: "Our paper <strong>“WellDunn: On the Robustness and Explainability of Language Models and Large Language Models in Identifying Wellness Dimensions”</strong> has been accepted at the <strong>EMNLP BlackBox NLP Workshop 2024</strong>." },
  { date: "Feb '24", type: "position", text: "Started as an <strong>Undergraduate Researcher</strong> at the <strong>Singh Lab and HealthNLP Lab</strong>." },
  { date: "Dec '23", type: "position", text: "Started as a <strong>Research Intern</strong> at <strong>Inria Centre, University of Lille, France</strong>." },
  { date: "Jul '23", type: "paper", text: "Our paper <strong>“Towards Vision-Language Mechanistic Interpretability: A Causal Tracing Tool for BLIP”</strong> has been accepted at the <strong>ICCV CLVL Workshop 2023</strong>." },
  { date: "Jun '23", type: "paper", text: "Our paper <strong>“Knowledge Graph Guided Semantic Evaluation of Language Models For User Trust”</strong> was accepted at <strong>IEEE CAI 2023</strong>." },
  { date: "Nov '22", type: "position", text: "Started as a <strong>Research Intern</strong> at <strong>University of Maryland, Baltimore</strong>." },
  { date: "Dec '21", type: "milestone", text: "Accepted into <strong>IIT Kharagpur</strong>." }
];

const PAPERS = [
  {
    title: "How Do Linear Probes Emerge? A Circuit-Tracing Framework with Concept-Targeted Attribution",
    image: "images/anchor.png",
    authors: "<strong>Vedant Palit</strong>, Florent Draye, Terry Jingchen Zhang, Bernhard Schölkopf, Zhijing Jin",
    links: [
      { label: "Repo", url: "https://github.com/vedantpalit/concept-targeted-attribution" },
      { label: "Paper", url: "https://github.com/vedantpalit/concept-targeted-attribution/blob/main/ConceptProbeAttribution.pdf" }
    ]
  },
  {
    title: "Simulating Eutopia: Revisiting Long-term Fairness with Outcomes, Performativity, and Dynamics",
    image: "images/eutopia.png",
    authors: "<strong>Vedant Palit</strong>, Udvas Das, Brahim Driss, Debabrota Basu",
    badges: [
      { label: "ECAF 2026 · Spotlight", tone: "award" },
      { label: "ICML AI4LAW Workshop 2026", tone: "neurips" }
    ],
    links: [
      { label: "Repo", url: "https://github.com/brahimdriss/LoanSimulator" },
      { label: "Paper", url: "https://github.com/brahimdriss/LoanSimulator/blob/main/Eutopia_2026.pdf" }
    ]
  },
  {
    title: "CLT-Forge: A Scalable Library for Cross-Layer Transcoders and Attribution Graphs",
    image: "images/clt-forge.png",
    authors: "Florent Draye, <strong>Vedant Palit</strong>, Abir Harrasse, Tung-Yu Wu, Jiarui Liu, Punya Syon Pandey, Roderick Wu, Chih-Hao Hsu, Terry Jingchen Zhang, Zhijing Jin, Bernhard Schölkopf",
    badges: [
      { label: "Under Review", tone: "review" },
      { label: "EMNLP Demo Track 2026", tone: "acl" }
    ],
    links: [
      { label: "Repo", url: "https://github.com/LLM-Interp/CLT-Forge" },
      { label: "Paper", url: "https://arxiv.org/abs/2603.21014" }
    ]
  },
  {
    title: "Forgotten Polygons: Multimodal Large Language Models are Shape-Blind",
    image: "images/shapeblind.png",
    authors: "William Rudman*, Michal Golovanesky*, Amir Bar, <strong>Vedant Palit</strong>, Yann LeCun, Carsten Eickhoff, Ritambhara Singh",
    badges: [{ label: "ACL Findings 2025", tone: "acl" }],
    links: [
      { label: "Repo", url: "https://github.com/rsinghlab/Shape-Blind" },
      { label: "Paper", url: "https://arxiv.org/abs/2502.15969" }
    ]
  },
  {
    title: "What Do VLMs NOTICE? A Mechanistic Interpretability Pipeline for Noise-free Text-Image Corruption and Evaluation",
    image: "images/notice.png",
    authors: "Michal Golovanesky*, William Rudman*, <strong>Vedant Palit</strong>, Ritambhara Singh, Carsten Eickhoff",
    badges: [{ label: "NAACL 2025", tone: "acl" }],
    links: [
      { label: "Repo", url: "https://github.com/wrudman/NOTICE" },
      { label: "Paper", url: "https://aclanthology.org/2025.naacl-long.571/" }
    ]
  },
  {
    title: "WellDunn: On the Robustness and Explainability of Language Models and Large Language Models in Identifying Wellness Dimensions",
    image: "images/welldunn.png",
    authors: "Ali Mohammadi, Edward Raff, Jinendra Malekar, <strong>Vedant Palit</strong>, Francis Ferraro, Manas Gaur",
    badges: [{ label: "EMNLP 2024 · BlackBox NLP Workshop", tone: "acl" }],
    links: [
      { label: "Repo", url: "https://github.com/vedantpalit/WellDunn" },
      { label: "Paper", url: "https://aclanthology.org/2024.blackboxnlp-1.23/" }
    ]
  },
  {
    title: "Towards Vision-Language Mechanistic Interpretability: A Causal Tracing Tool for BLIP",
    image: "images/mechinterpvl.png",
    authors: "<strong>Vedant Palit*</strong>, Rohan Pandey*, Aryaman Arora, Paul Pu Liang",
    badges: [{ label: "ICCV 2023 · CLVL Workshop", tone: "cvf" }],
    links: [
      { label: "Repo", url: "https://github.com/vedantpalit/Towards-Vision-Language-Mechanistic-Interpretability" },
      { label: "Paper", url: "https://openaccess.thecvf.com/content/ICCV2023W/CLVL/papers/Palit_Towards_Vision-Language_Mechanistic_Interpretability_A_Causal_Tracing_Tool_for_BLIP_ICCVW_2023_paper.pdf" }
    ]
  },
  {
    title: "Knowledge Graph Guided Semantic Evaluation of Language Models For User Trust",
    image: "images/kgeval.png",
    authors: "Kaushik Roy, Tarun Garg, <strong>Vedant Palit</strong>, Yuxin Zi, Vignesh Narayanan, Amit Sheth",
    badges: [{ label: "IEEE CAI 2023", tone: "ieee" }],
    links: [
      { label: "Repo", url: "https://github.com/vedantpalit/KG-LLM" },
      { label: "Paper", url: "https://ieeexplore.ieee.org/document/10195092" }
    ]
  },
  {
    title: "Exploring The Potential of Large Language Models for Assisting with Mental Health Diagnostic Assessments",
    image: "images/kaushik_paper.png",
    authors: "Kaushik Roy, Harshul Surana, Darssan Eswaramoorthi, Yuxin Zi, <strong>Vedant Palit</strong>, Ritvik Garimella, Amit Sheth",
    badges: [{ label: "ACM Trans. on Computing for Healthcare 2025", tone: "acm" }],
    links: [
      { label: "Repo", url: "https://github.com/kauroy1994/Large-Language-Models-for-Assisting-with-Mental-Health-Diagnostic-Assessments" },
      { label: "Paper", url: "https://arxiv.org/abs/2501.01305" }
    ]
  },
  {
    hidden: true,
    title: "Adaptive Federated Learning Defences via Trust-Aware Deep Q-Networks",
    image: "images/adaptive_fl.png",
    authors: "<strong>Vedant Palit</strong>",
    badges: [{ label: "Under Review", tone: "review" }],
    links: [
      { label: "Repo", url: "https://github.com/vedantpalit/Adaptive-FL-DQN-Defense" },
      { label: "Preprint", url: "https://arxiv.org/abs/2510.01261" }
    ]
  }
];

const PROJECTS = [
  {
    title: "Knowledge Graph Generation from Scraped Text",
    image: "images/kgscreen.png",
    context: "AIISC Project",
    links: [{ label: "Repository", url: "https://github.com/vedantpalit/KNOWLEDGE-GRAPHS" }],
    description: "Created an automated text extraction system, for custom information extraction from an input wikipedia page followed by entity generation through parsing, named entity correlation and KG generation."
  },
  {
    title: "Image Stitching and RANSAC Line Fitting",
    image: "images/foto1_stitched.png",
    context: "Task for Autonomous Ground Vehicles Group, IIT KGP",
    links: [{ label: "Repository", url: "https://github.com/vedantpalit/AUTONOMOUS-DRIVING/tree/main/TASKS/TASK-2" }],
    description: "Constructed a pipeline of the image stitching through brute-force matching as well as KNN Association of keypoints in two images of the same scene taken from close yet different angles."
  },
  {
    title: "Kalman Filter Trajectory Determination",
    image: "images/Trajectory_Superposition.png",
    context: "Task for Autonomous Ground Vehicles Group, IIT KGP",
    links: [{ label: "Repository", url: "https://github.com/vedantpalit/AUTONOMOUS-DRIVING/tree/main/TASKS/TASK-5" }],
    description: "Developed a trajectory determination program based on the kalman filter algorithm utilising information from acceleration and position sensors to predict the next position of a vehicle."
  },
  {
    hidden: true,
    title: "Constrained Ocean Freight Optimization",
    image: "images/vrp.png",
    context: "Operations Research Lab Project",
    links: [{ label: "Repository", url: "https://github.com/vedantpalit/Ocean-Freight-Optimization" }],
    description: "Utilised and adapted the concept of capacity constrained vehicle routing to determine the optimal path to be taken by ships from a shipping company, using Gurobipy and CPLEX."
  },
  {
    hidden: true,
    title: "Lane Detection and Gamma Correction",
    image: "images/dusseldorf2_segment.png",
    context: "Task for Autonomous Ground Vehicles Group, IIT KGP",
    links: [{ label: "Repository", url: "https://github.com/vedantpalit/AUTONOMOUS-DRIVING/tree/main/TASKS/TASK-3" }],
    description: "Designed an algorithmic implementation of lane detection utilising a Gaussian blur and Gamma Correction for brightness adjustment, followed by canny edge and contour detection to detect roads in real-life images."
  }
];

/* One row per role; venues flow inline, so new venues never add rows. */
const SERVICE = [
  {
    role: "Reviewer",
    venues: [
      "ICLR (2025, 2026)",
      "NeurIPS (2026)",
      "ICML AI4GOOD Workshop (2026)",
      "NeurIPS Mechanistic Interpretability Workshop (2025)",
      "ACM SIGKDD Workshop (2024)"
    ]
  }
];

/* One row per platform; posts flow inline, so new posts never add rows. */
const BLOGS = [
  {
    source: "Medium",
    posts: [
      { title: "Pruning and Merging of Tokens for Efficient VL Models", url: "https://medium.com/@vedantpalit10/pruning-and-merging-of-tokens-for-efficient-vl-models-a-review-5fa833a0c7e6" },
      { title: "I-JEPA: Self-Supervised Image-Based Learning", url: "https://medium.com/@vedantpalit10/i-jepa-an-improved-approach-towards-self-supervised-image-based-learning-f622a5793980" }
    ]
  },
  {
    source: "WordPress",
    posts: [
      { title: "A Newer Perspective towards Evolution", url: "https://thenonexistentpresent.wordpress.com/2023/06/13/a-newer-perspective-towards-evolution/" },
      { title: "A Bridge between the Past and the Future", url: "https://thenonexistentpresent.wordpress.com/2023/05/27/a-bridge-between-the-past-and-the-future/" },
      { title: "Rebirth?", url: "https://thenonexistentpresent.wordpress.com/2024/01/06/a-rebirth/" }
    ]
  }
];
