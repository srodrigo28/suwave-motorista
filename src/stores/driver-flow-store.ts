import { create } from "zustand";
import type { UploadResult } from "@/services/driver-client";

export type VehicleBrandOption = {
  codigo: string;
  nome: string;
};

export type DriverSignupForm = {
  accepted_terms: boolean;
  birth_date: string;
  cnpj: string;
  confirm_password: string;
  cpf: string;
  email: string;
  full_name: string;
  password: string;
  pix_account: string;
  pix_key_type: string;
  whatsapp: string;
};

export type VehicleForm = {
  model: string;
  plate: string;
};

export type VehicleUploads = {
  front?: UploadResult;
  interior?: UploadResult;
  rear?: UploadResult;
  side?: UploadResult;
};

const initialSignupForm: DriverSignupForm = {
  accepted_terms: false,
  birth_date: "",
  cnpj: "",
  confirm_password: "",
  cpf: "",
  email: "",
  full_name: "",
  password: "",
  pix_account: "",
  pix_key_type: "",
  whatsapp: "",
};

const initialVehicleForm: VehicleForm = {
  model: "",
  plate: "",
};

type DriverFlowState = {
  cnhBack?: File;
  cnhFront?: File;
  faceFile?: File;
  selectedBrand: VehicleBrandOption | null;
  signupForm: DriverSignupForm;
  vehicleForm: VehicleForm;
  vehicleUploads: VehicleUploads;
  resetFlow: () => void;
  setCnhBack: (file: File) => void;
  setCnhFront: (file: File) => void;
  setFaceFile: (file: File) => void;
  setSelectedBrand: (brand: VehicleBrandOption | null) => void;
  setSignupForm: (form: DriverSignupForm) => void;
  setVehicleForm: (form: VehicleForm) => void;
  setVehicleUploads: (uploads: VehicleUploads) => void;
  updateSignupForm: (field: keyof DriverSignupForm, value: string) => void;
  updateVehicleForm: (field: keyof VehicleForm, value: string) => void;
};

export const useDriverFlowStore = create<DriverFlowState>()((set) => ({
  cnhBack: undefined,
  cnhFront: undefined,
  faceFile: undefined,
  selectedBrand: null,
  signupForm: initialSignupForm,
  vehicleForm: initialVehicleForm,
  vehicleUploads: {},
  resetFlow: () =>
    set({
      cnhBack: undefined,
      cnhFront: undefined,
      faceFile: undefined,
      selectedBrand: null,
      signupForm: initialSignupForm,
      vehicleForm: initialVehicleForm,
      vehicleUploads: {},
    }),
  setCnhBack: (upload) => set({ cnhBack: upload }),
  setCnhFront: (upload) => set({ cnhFront: upload }),
  setFaceFile: (file) => set({ faceFile: file }),
  setSelectedBrand: (brand) => set({ selectedBrand: brand }),
  setSignupForm: (form) => set({ signupForm: form }),
  setVehicleForm: (form) => set({ vehicleForm: form }),
  setVehicleUploads: (uploads) => set({ vehicleUploads: uploads }),
  updateSignupForm: (field, value) =>
    set((state) => ({
      signupForm: {
        ...state.signupForm,
        [field]: value,
      },
    })),
  updateVehicleForm: (field, value) =>
    set((state) => ({
      vehicleForm: {
        ...state.vehicleForm,
        [field]: value,
      },
    })),
}));
