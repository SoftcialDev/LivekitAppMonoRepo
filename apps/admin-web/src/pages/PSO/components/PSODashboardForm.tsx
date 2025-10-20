import React from 'react';
import managementIcon from '@/shared/assets/manage_icon_sidebar.png';
import { Dropdown, DropdownOption } from '@/shared/ui/Dropdown';
import { FormField } from '@/shared/ui/FormField';
import AddModal from '@/shared/ui/ModalComponent';
import { useReportFormModal } from '../hooks/useReportFormModal';

/**
 * Available report types for the dashboard form.
 */
const REPORT_OPTIONS: DropdownOption[] = [
  { label: 'Disconnections', value: 'Disconnections' },
  { label: 'Admissions',     value: 'Admissions'     },
  { label: 'Assistance',     value: 'Assistance'     },
];

/**
 * Props for the PsoDashboardForm component.
 *
 * @property psoEmail - PSO's email address used to submit the report.
 * @property senderName - Display name for the report sender.
 */
export interface PsoDashboardFormProps {
  psoEmail: string;
  senderName: string;
}

/**
 * Renders a modal form allowing a PSO to submit one of three report types:
 * Disconnections, Admissions, or Assistance.
 *
 * Disconnections includes additional date and time selectors, and all forms
 * allow an optional image attachment.
 *
 * @param props - Component props {@link PsoDashboardFormProps}
 */
export const PsoDashboardForm: React.FC<PsoDashboardFormProps> = ({
  psoEmail,
  senderName,
}) => {
  const {
    isOpen,
    open,
    close,
    formType,
    setFormType,
    formData,
    handleChange,
    handleNumberChange,
    handleImageChange,
    submit,
    loading,       
    error,  
  } = useReportFormModal(psoEmail, senderName);

  // Compute date range: yesterday and today in YYYY-MM-DD format
  const today     = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86400_000).toISOString().slice(0, 10);

  // Helpers for 12-hour time selection
  const hours       = Array.from({ length: 12 }, (_, i) => i + 1);
  const minutes     = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'));
  const ampmOptions = ['AM', 'PM'] as const;

  return (
    <>
      <button
        onClick={open}
        className="px-8 py-2 bg-[var(--color-secondary)] text-[var(--color-primary-dark)]
                   font-semibold rounded-full hover:bg-[var(--color-tertiary)] transition-colors"
      >
        Show Reports Forms
      </button>

      <AddModal
        open={isOpen}
        title="Submit Report"
        iconSrc={managementIcon}
        iconAlt="Report"
        onClose={close}
        onConfirm={submit}
        confirmLabel="Submit"
        className="overflow-visible w-fit"
        loading={loading}                            // ← added
        loadingAction="Submitting report..."         // ← added
      >
        <form className="space-y-6">
          {/* Form header */}
          <div className="border-b border-gray-200 pb-4">
            <h3 className="text-lg font-medium text-white">Submit Report</h3>
            <p className="mt-1 text-sm text-white">
              Choose a report type and fill out the fields below.
            </p>
          </div>

          {/* Report Type selector */}
          <div className="sm:col-span-3">
            <label htmlFor="reportType" className="block text-sm font-medium text-white">
              Report Type
            </label>
            <div className="mt-2">
              <Dropdown
                options={REPORT_OPTIONS}
                value={formType}
                onSelect={val => setFormType(val as any)}
                className="relative inline-block"
                label=""
                menuBgClassName="bg-[var(--color-primary)] text-white"
                buttonClassName={`
                  flex items-center justify-between
                  md:w-48
                  sm:w-32
                  px-4 py-2
                  text-white
                  rounded-lg
                  focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]
                  bg-[#764E9F]
                `}
                menuClassName={`
                  absolute left-0 mt-1
                  md:w-48
                  sm:w-32
                  bg-[var(--color-primary)]
                  divide-y divide-gray-100
                  rounded-lg shadow-lg z-50
                  max-h-60 overflow-auto
                  [&>ul>li>button]:bg-[var(--color-primary)]
                  [&>ul>li>button]:text-white
                  [&>ul>li>button:hover]:bg-[#63367a]
                `}
              />
            </div>
          </div>

          {/* Dynamic fields based on selected report type */}
          <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
            {formType === 'Disconnections' && (
              <>
                <FormField
                  id="rnName"
                  label="RN Name"
                  value={formData.rnName || ''}
                  onChange={handleChange}
                  className="sm:col-span-3"
                />
                <FormField
                  id="patientInitials"
                  label="Patient Initials"
                  value={formData.patientInitials || ''}
                  onChange={handleChange}
                  className="sm:col-span-3"
                />

                {/* Date selector */}
                <FormField
                  id="disconnectionDate"
                  label="Date of Disconnection"
                  type="date"
                  value={formData.disconnectionDate}
                  onChange={handleChange}
                  className="sm:col-span-3"
                  inputProps={{ min: yesterday, max: today, lang: 'en-US' }}
                />

                {/* Time selectors */}
                <div className="sm:col-span-3">
                  <label htmlFor="hour" className="block text-sm font-medium text-white">
                    Time of Disconnection
                  </label>
                  <div className="mt-1 flex space-x-2 overflow-visible z-50 ">
                    <select
                      name="hour"
                      value={formData.hour}
                      onChange={handleChange}
                      className="mt-1 block rounded-md border-gray-300 shadow-sm
                        bg-[var(--color-primary)]       sm:text-sm"
                    >
                      {hours.map(h => (
                        <option key={h} value={String(h)}>{h}</option>
                      ))}
                    </select>
                    :
                    <input
                      name="minute"
                      type="number"
                      min={0}
                      max={59}
                      step={1}
                      value={formData.minute ?? ''}
                      onChange={handleNumberChange}
                      className="
                        mt-1 block rounded-md shadow-sm
                        bg-[var(--color-primary)] sm:text-sm
                        focus:outline-none focus:ring-0 focus:border-gray-300
                        text-center
                      "
                      placeholder="00"
                    />
                    <select
                      name="ampm"
                      value={formData.ampm}
                      onChange={handleChange}
                      className="mt-1 block rounded-md  shadow-sm
                                bg-[var(--color-primary)] sm:text-sm"
                    >
                      {ampmOptions.map(p => (
                        <option key={p} value={p}>{p}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <FormField
                  id="reason"
                  label="Reason"
                  type="textarea"
                  value={formData.reason || ''}
                  onChange={handleChange}
                  className="sm:col-span-6"
                />
                <FormField
                  id="hospital"
                  label="Hospital"
                  value={formData.hospital || ''}
                  onChange={handleChange}
                  className="sm:col-span-3"
                />
                <FormField
                  id="totalPatients"
                  label="Total Patients"
                  type="number"
                  value={formData.totalPatients ?? 0}
                  onChange={handleNumberChange}
                  className="sm:col-span-3 text-center"
                />
              </>
            )}

            {formType === 'Admissions' && (
              <>
                <FormField
                  id="facility"
                  label="Facility"
                  value={formData.facility || ''}
                  onChange={handleChange}
                  className="sm:col-span-3"
                />
                <FormField
                  id="unit"
                  label="Unit"
                  value={formData.unit || ''}
                  onChange={handleChange}
                  className="sm:col-span-3"
                />
              </>
            )}

            {formType === 'Assistance' && (
              <>
                <FormField
                  id="facility"
                  label="Facility"
                  value={formData.facility || ''}
                  onChange={handleChange}
                  className="sm:col-span-3"
                />
                <FormField
                  id="patientInitials"
                  label="Patient Initials"
                  value={formData.patientInitials || ''}
                  onChange={handleChange}
                  className="sm:col-span-3"
                />
                <FormField
                  id="totalPatientsInPod"
                  label="Total Patients in Pod"
                  type="number"
                  value={formData.totalPatientsInPod ?? 0}
                  onChange={handleNumberChange}
                  className="sm:col-span-3"
                />
              </>
            )}
          </div>
        </form>
      </AddModal>
    </>
  );
};
