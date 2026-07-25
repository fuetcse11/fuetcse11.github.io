// ============================================================
// এই ফাইলটাই আপনার একমাত্র "সেটিংস" ফাইল।
// নতুন সেমিস্টার/কোর্স যোগ করতে চাইলে শুধু এই ফাইলটা এডিট করবেন।
// ============================================================

const CONFIG = {
  // Google Cloud Console থেকে পাওয়া মান — README.md এ ধাপে ধাপে বলা আছে
  CLIENT_ID: "383900399527-i9a8uca9aubjq12efm7gatpnpc7miud8.apps.googleusercontent.com",
  API_KEY: "AIzaSyAD2vASiFcvHkFa1FdBMLUp5hvfvVoMz5c",

  // যে Google একাউন্ট দিয়ে লগইন করলে "এডমিন মোড" চালু হবে
  ADMIN_EMAIL: "fuetcse11@gmail.com",

  // Google Drive-এ যে ফোল্ডারটাকে "রুট" ধরে সব সেমিস্টার/কোর্স তার ভেতরে তৈরি হবে
  // এই ফোল্ডারটা Drive-এ বানিয়ে "Anyone with the link – Viewer" শেয়ার করে
  // তার আইডি এখানে বসাবেন (README.md-তে দেখানো আছে কিভাবে বের করবেন)
  ROOT_FOLDER_ID: "1uiFPVPqig2eXLKn1pEaT-EYhIiP1oCKq",

  // প্রতিটা কোর্সের ভেতরে এই তিনটা ভাগ থাকবে
  CATEGORIES: ["Books", "Previous Years' Questions", "Class Notes"],

  // এখানে আপনার কলেজের প্রকৃত সেমিস্টার ও কোর্সের নাম বসান
  SEMESTERS: [
    {name: "Semester I (1st Year 1st Semester)",
      courses: [
		"CSE-1101: Fundamentals of Computers and Computing",
		"CSE-1102: Discrete Mathematics",
		"EEE-1103: Electrical Circuits",
		"CHE-1104: Chemistry",
		"MATH-1105: Differential and Integral Calculus",
		"SS-1106: Government and Public Administration",
		"CSE-1111: Fundamentals of Computers and Computing Lab",
		"EEE-1113: Electrical Circuits Lab",
		"CHE-1114: Chemistry Lab"
	  ]
    },
    {name: "Semester II (1st Year 2nd Semester)",
      courses: [
		"CSE-1201: Fundamentals of Programming",
		"CSE-1202: Digital Logic Design",
		"PHY-1203: Physics",
		"MATH-1204: Methods of Integration, Differential Equations and Serie",
		"ENG-1205: Developing English Language Skills",
		"CSE-1211: Fundamentals of  Programming Lab",
		"CSE-1212: Digital Logic Design Lab",
		"PHY-1213: Physics Lab",
		"ENG-1215: Developing English Language Skills Lab"
	  ]
    },
    {name: "Semester III (2nd Year 1st Semester)",
      courses: [
		"CSE-2101: Data Structures and Algorithms",
		"CSE-2102: Object Oriented Programming",
		"CSE-2103: Digital Electronics and Pulse Technique",
		"EEE-2104: Electronic Devices and Circuits",
		"MATH-2105: Linear Algebra",
		"SS-2106: Bangladesh Studies",
		"CSE-2111: Data Structures and Algorithms Lab",
		"CSE-2112: Object Oriented Programming Lab",
		"CSE-2113: Digital Electronics and Pulse Technique",
		"EEE-2114: Electronic Devices and Circuits Lab"
	]
    },
	{name: "Semester IV (2nd Year 2nd Semester)",
      courses: [
		"CSE-2201: Database Management Systems-I",
		"CSE-2202: Design and Analysis of Algorithms-I",
		"CSE-2203: Data and Telecommunication",
		"CSE-2204: Computer Architecture and Organization",
		"CSE-2205: Introduction to Mechatronics",
		"CSE-2211: Database Management Systems  - I  Lab",
		"CSE-2212: Design and Analysis of Algorithms - I Lab",
		"CSE-2213: Data and Telecommunication Lab",
		"CSE-2216: Application Development Lab"
	  ]
    },
	{name: "Semester V (3rd Year 1st Semester)",
      courses: [
		"CSE-3101: Computer Networking",
		"CSE-3102: Software Engineering",
		"CSE-3103: Microprocessor and Microcontroller",
		"CSE-3104: Database Management Systems -II",
		"MATH-3105: Multivariable Calculus and Geometry",
		"CSE-3111: Computer Networking Lab",
		"CSE-3112: Software Engineering Lab",
		"CSE-3113: Microprocessor and Assembly Language Lab",
		"CSE-3116: Microcontroller Lab"
	  ]
    },
	{name: "Semester VI (3rd Year 2nd Semester)",
      courses: [
		"CSE-3201: Operating Systems",
		"CSE-3202: Numerical Methods",
		"CSE-3203: Design and Analysis of Algorithms - II",
		"CSE-3204: Formal Language, Automata and Computability",
		"STAT-3205: Introduction to Probability and Statistics",
		"CSE-3211: Operating Systems Lab",
		"CSE-3212: Numerical Methods Lab",
		"CSE-3216: Software Design Patterns Lab",
		"ENG-3217: Technical Writing and Presentation Lab"
	  ]
    },
	{name: "Semester VII (4th Year 1st Semester)",
      courses: [
		"CSE-4101: Artificial Intelligence",
		"CSE-4102: Mathematical and Statistical Analysis for Engineers",
		"SS-4103: Entrepreneurship for IT Business",
		"CSE-4XXX: Option-I",
		"CSE-4XXX: Option-II",
		"CSE-4111: Artificial Intelligence Lab",
		"CSE-4XXX: Option-I Lab",
		"CSE-4113: Internet Programming Lab",
		"CSE-4114: Project"
	  ]
    },
    {name: "Semester VIII (4th Year 2nd Semester)",
      courses: [
		"ECO-4201: Economics",
		"CSE-4202: Society and Technology",
		"SS-4203: Engineering Ethics",
		"CSE-4XXX: Option-III",
		"CSE-4XXX: Option-IV",
		"CSE-4XXX: Option-III Lab",
		"CSE-4214: Project"
	  ]
    }
  ]
};
