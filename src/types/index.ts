export type Message = {
  id: string;
  role: "user" | "ai";
  text: string;
  audioUri?: string;
  imageUrl?: string;
};

export type Language = {
  value: string;
  label: string;
};

export type PatientDetails = {
  name: string;
  age: string;
  phone: string;
  location?: string;
};

export type Prescription = {
    diagnosis: string;
    medicines: { name: string; dosage: string; }[];
    instructions: string;
    date: string;
}
