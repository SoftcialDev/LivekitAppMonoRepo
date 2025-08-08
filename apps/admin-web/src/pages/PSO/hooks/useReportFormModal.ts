import { ContactManagersFormPayload, submitContactManagersForm } from '@/shared/api/contactManagerClient';
import { useToast } from '@/shared/ui/ToastContext';
import { useState, ChangeEvent } from 'react';


type ReportType = 'Disconnections' | 'Admissions' | 'Assistance';

/**
 * Hook to manage the state, loading, error, and submission of a Contact Managers report form in a modal.
 *
 * @param psoEmail    - The PSO’s email address, used for audit/logging.
 * @param senderName  - The full name of the submitting user.
 * @returns An object containing:
 *   - `isOpen`: whether the modal is open
 *   - `open()`: function to open the modal (resets form)
 *   - `close()`: function to close the modal (clears form)
 *   - `formType`: currently selected report type
 *   - `setFormType()`: setter for report type
 *   - `formData`: the current form fields
 *   - `handleChange()`: handler for text/select inputs
 *   - `handleNumberChange()`: handler for number inputs
 *   - `handleImageChange()`: handler for file input
 *   - `imageFile`: the selected image File (or null)
 *   - `submit()`: async function to build payload and send to backend
 *   - `loading`: whether a submission is in progress
 *   - `error`: any error encountered during submission
 */
export function useReportFormModal(
  psoEmail: string,
  senderName: string
): {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  formType: ReportType;
  setFormType: React.Dispatch<React.SetStateAction<ReportType>>;
  formData: Partial<ContactManagersFormPayload> & {
    disconnectionDate: string;
    hour: string;
    minute: string;
    ampm: 'AM' | 'PM';
  };
  handleChange: (
    e: ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => void;
  handleNumberChange: (e: ChangeEvent<HTMLInputElement>) => void;
  handleImageChange: (e: ChangeEvent<HTMLInputElement>) => void;
  imageFile: File | null;
  submit: () => Promise<void>;
  loading: boolean;
  error: Error | null;
} {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [formType, setFormType] = useState<ReportType>('Disconnections');
  const [formData, setFormData] = useState<
    Partial<ContactManagersFormPayload> & {
      disconnectionDate: string;
      hour: string;
      minute: string;
      ampm: 'AM' | 'PM';
    }
  >({
    disconnectionDate: new Date().toISOString().slice(0, 10),
    hour: '12',
    minute: '00',
    ampm: 'AM',
  });
  const [imageFile, setImageFile] = useState<File | null>(null);

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const { showToast } = useToast();

  const open = (): void => {
    setIsOpen(true);
    setFormType('Disconnections');
    setFormData({
      disconnectionDate: new Date().toISOString().slice(0, 10),
      hour: '12',
      minute: '00',
      ampm: 'AM',
    });
    setImageFile(null);
    setError(null);
  };

  const close = (): void => {
    setIsOpen(false);
    setFormData({
      disconnectionDate: new Date().toISOString().slice(0, 10),
      hour: '12',
      minute: '00',
      ampm: 'AM',
    });
    setImageFile(null);
    setError(null);
  };

  const handleChange = (
    e: ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ): void => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleNumberChange = (
    e: ChangeEvent<HTMLInputElement>
  ): void => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: Number(value) }));
  };

  const handleImageChange = (
    e: ChangeEvent<HTMLInputElement>
  ): void => {
    setImageFile(e.target.files?.[0] ?? null);
  };

  const fileToBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });

  const submit = async (): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      let imageBase64: string | undefined;
      if (imageFile) {
        const dataUrl = await fileToBase64(imageFile);
        imageBase64 = dataUrl.split(',')[1];
      }

      let timeOfDisconnection: string | undefined;
      if (formType === 'Disconnections') {
        let h = parseInt(formData.hour!, 10);
        if (formData.ampm === 'PM' && h < 12) h += 12;
        if (formData.ampm === 'AM' && h === 12) h = 0;
        const hh = String(h).padStart(2, '0');
        const mm = String(formData.minute!).padStart(2, '0');
        timeOfDisconnection = `${hh}:${mm}`;
      }

      const payload: ContactManagersFormPayload = {
        formType,
        ...(formType === 'Disconnections' && {
          rnName: formData.rnName,
          patientInitials: formData.patientInitials,
          timeOfDisconnection,
          reason: formData.reason,
          hospital: formData.hospital,
          totalPatients: formData.totalPatients,
        }),
        ...(formType === 'Admissions' && {
          facility: formData.facility,
          unit: formData.unit,
        }),
        ...(formType === 'Assistance' && {
          facility: formData.facility,
          patientInitials: formData.patientInitials,
          totalPatientsInPod: formData.totalPatientsInPod,
        }),
        ...(imageBase64 && { imageBase64 }),
      };

      await submitContactManagersForm(payload);
      showToast('Report submitted successfully', 'success');
      close();
    } catch (err: any) {
      console.error('submit error:', err);
      setError(err);
      showToast('Failed to submit report', 'error');
    } finally {
      setLoading(false);
    }
  };

  return {
    isOpen,
    open,
    close,
    formType,
    setFormType,
    formData,
    handleChange,
    handleNumberChange,
    handleImageChange,
    imageFile,
    submit,
    loading,
    error,
  };
}
