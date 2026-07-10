import imgCircle from "../assets/attendance-images/img-circle.svg";
import imgSquare from "../assets/attendance-images/img-square.svg";
import imgTriangle from "../assets/attendance-images/img-triangle.svg";
import imgDiamond from "../assets/attendance-images/img-diamond.svg";
import imgHexagon from "../assets/attendance-images/img-hexagon.svg";
import imgCross from "../assets/attendance-images/img-cross.svg";
import imgWave from "../assets/attendance-images/img-wave.svg";
import imgDouble from "../assets/attendance-images/img-double.svg";
import imgPattern9 from "../assets/attendance-images/img-pattern9.svg";
import imgPattern10 from "../assets/attendance-images/img-pattern10.svg";

export type AttendanceImage = {
  id: string;
  label: string;
  src: string;
};

const IMAGE_FILE_MAP: Record<string, string> = {
  "img-circle.svg": imgCircle,
  "img-square.svg": imgSquare,
  "img-triangle.svg": imgTriangle,
  "img-diamond.svg": imgDiamond,
  "img-hexagon.svg": imgHexagon,
  "img-cross.svg": imgCross,
  "img-wave.svg": imgWave,
  "img-double.svg": imgDouble,
  "img-pattern9.svg": imgPattern9,
  "img-pattern10.svg": imgPattern10,
};

const IMAGE_DEFINITIONS = [
  { id: "circle", label: "Pattern A", file: "img-circle.svg" },
  { id: "square", label: "Pattern B", file: "img-square.svg" },
  { id: "triangle", label: "Pattern C", file: "img-triangle.svg" },
  { id: "diamond", label: "Pattern D", file: "img-diamond.svg" },
  { id: "hexagon", label: "Pattern E", file: "img-hexagon.svg" },
  { id: "cross", label: "Pattern F", file: "img-cross.svg" },
  { id: "wave", label: "Pattern G", file: "img-wave.svg" },
  { id: "double", label: "Pattern H", file: "img-double.svg" },
  { id: "pattern9", label: "Pattern I", file: "img-pattern9.svg" },
  { id: "pattern10", label: "Pattern J", file: "img-pattern10.svg" },
] as const;

export const ATTENDANCE_IMAGES: AttendanceImage[] = IMAGE_DEFINITIONS.map((image) => ({
  id: image.id,
  label: image.label,
  src: IMAGE_FILE_MAP[image.file] ?? "",
}));

export function getAttendanceImageById(id: string): AttendanceImage | undefined {
  return ATTENDANCE_IMAGES.find((image) => image.id === id);
}
