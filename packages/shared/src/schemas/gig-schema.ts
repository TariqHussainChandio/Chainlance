import { z } from "zod";
import { isValidTag } from "../utils/text-validation";

export const GIG_TYPES = ["software", "hardware"] as const;
export type GigType = (typeof GIG_TYPES)[number];

export const SOFTWARE_CATEGORIES = [
  "Web Development","Mobile Development","UI/UX Design","Graphic Design",
  "Writing & Translation","Video & Animation","Marketing","Data Science",
  "Blockchain & Web3","AI & Machine Learning",
] as const;

export const HARDWARE_CATEGORIES = [
  "Embedded Systems","PCB Design","Robotics & Automation","IoT & Sensors",
  "3D Printing","Electronics & Circuits","Mechanical Design","FPGA & Digital Logic",
] as const;

export const CATEGORIES = [...SOFTWARE_CATEGORIES, ...HARDWARE_CATEGORIES, "Other"] as const;
export type Category = (typeof CATEGORIES)[number];

export const CATEGORY_SKILLS: Record<string, readonly string[]> = {
  "Web Development":       ["React","Angular","Vue","NextJS","TypeScript","JavaScript","NodeJS","MongoDB","PostgreSQL","Firebase","GraphQL","Docker","Redux","Prisma","Tailwind"],
  "Mobile Development":    ["ReactNative","Flutter","Swift","Kotlin","Firebase","Redux","SQLite","Xcode","Dart","Android"],
  "UI/UX Design":          ["Figma","Sketch","Prototyping","Wireframing","Research","Interaction","Accessibility","Adobe","Testing"],
  "Graphic Design":        ["Illustrator","Photoshop","Branding","Typography","InDesign","AfterEffects","Canva","Logos"],
  "Writing & Translation": ["Copywriting","Blogging","SEO","Translation","Editing","Proofreading","Technical","Creative"],
  "Video & Animation":     ["Premiere","AfterEffects","Motion","Rendering","Editing","Animation","Compositing","Blender"],
  "Marketing":             ["SEO","Analytics","Email","Social","Content","Branding","Conversion","PPC","Strategy"],
  "Data Science":          ["Python","TensorFlow","PyTorch","Pandas","SQL","Visualization","Statistics","NLP","Matplotlib"],
  "Blockchain & Web3":     ["Solidity","Ethereum","Rust","Hardhat","DeFi","NFT","Truffle","Polygon","Chainlink"],
  "AI & Machine Learning": ["Python","TensorFlow","PyTorch","NLP","ComputerVision","Keras","Scikit","BERT","OpenCV"],
  "Embedded Systems":      ["Arduino","RaspberryPi","STM","AVR","FreeRTOS","CAN","SPI","UART","Microcontrollers","RTOS"],
  "PCB Design":            ["KiCad","Altium","Eagle","Schematic","Layout","Routing","Gerber","EMI","DRC"],
  "Robotics & Automation": ["ROS","Arduino","Servo","PID","Kinematics","Sensors","Actuators","SLAM","Navigation"],
  "IoT & Sensors":         ["MQTT","WiFi","Bluetooth","Zigbee","LoRa","Arduino","ESP","Sensors","Cloud"],
  "3D Printing":           ["FDM","SLA","CAD","Fusion","SolidWorks","Modeling","Prototyping","Slicing"],
  "Electronics & Circuits":["Analog","Digital","Oscilloscope","Soldering","RF","Power","Filters","Amplifiers"],
  "Mechanical Design":     ["CAD","SolidWorks","AutoCAD","FEA","CFD","Manufacturing","Assembly","Tolerances"],
  "FPGA & Digital Logic":  ["VHDL","Verilog","Xilinx","Altera","Quartus","Synthesis","Simulation","Timing"],
  "Other":                 [],
};

export const gigSchema = z
  .object({
    gigType: z.enum(GIG_TYPES).optional(),
    title: z.string().min(10, "Title must be at least 10 characters").max(100, "Title is too long"),
    description: z.string().min(50, "Describe your service in at least 50 chars").max(2000),
    category: z.enum(CATEGORIES),
    skills: z
      .array(z.string().min(1).refine((t) => isValidTag(t), { message: "Skills may only contain letters (A–Z, a–z)." }))
      .min(1, "Add at least one skill").max(10),
    pricingBasic: z.number().min(5, "Minimum $5").max(10000),
    pricingStandard: z.number().min(5).max(10000),
    pricingPremium: z.number().min(5).max(10000),
    deliveryDays: z.number().int().min(1).max(90),
  })
  .refine((d) => d.pricingStandard >= d.pricingBasic, { message: "Standard tier must cost at least as much as Basic", path: ["pricingStandard"] })
  .refine((d) => d.pricingPremium >= d.pricingStandard, { message: "Premium tier must cost at least as much as Standard", path: ["pricingPremium"] });

export type GigInput = z.infer<typeof gigSchema>;
