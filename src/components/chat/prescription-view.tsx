
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, MessageSquare, Smartphone } from "lucide-react";
import { useTranslation } from "@/hooks/use-translation";
import type { PatientDetails, Prescription } from "@/types";
import { Separator } from "../ui/separator";

interface PrescriptionViewProps {
  prescription: Prescription;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  selectedLanguage: string;
  patientDetails: PatientDetails | null;
}

export default function PrescriptionView({
  prescription,
  isOpen,
  onOpenChange,
  selectedLanguage,
  patientDetails,
}: PrescriptionViewProps) {
  const { t } = useTranslation(selectedLanguage);

  const formatPrescriptionForShare = () => {
    let text = `*${t('appName')} - ${t('prescriptionTitle')}*\n\n`;
    if (patientDetails) {
      text += `*${t('patientName')}:* ${patientDetails.name}\n`;
      text += `*${t('patientAge')}:* ${patientDetails.age}\n`;
      text += `*${t('patientPhone')}:* ${patientDetails.phone}\n\n`;
    }
    text += `*${t('date')}:* ${new Date(prescription.date).toLocaleString()}\n\n`;
    text += `*${t('diagnosisTitle')}:*\n${prescription.diagnosis}\n\n`;
    text += `*${t('medicinesTitle')}:*\n`;
    prescription.medicines.forEach(med => {
      text += `- ${med.name} (${med.dosage})\n`;
    });
    text += `\n*${t('instructionsTitle')}:*\n${prescription.instructions}\n\n`;
    text += `_${t('disclaimer')}_`;
    return text;
  };

  const getPlainTextPrescription = () => {
    const formatted = formatPrescriptionForShare();
    // basic conversion from markdown-like to plain text
    return formatted.replace(/\*/g, '').replace(/_/g, '');
  }

  const handleDownload = () => {
    const plainText = getPlainTextPrescription();
    const blob = new Blob([plainText], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "prescription.txt";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };
  
  const handleSendWhatsApp = () => {
    const text = encodeURIComponent(formatPrescriptionForShare());
    const phone = patientDetails?.phone?.replace(/\D/g, '');
    let url = `https://wa.me/`;
    if (phone) {
      url += `${phone}?text=${text}`;
    } else {
      url += `?text=${text}`;
    }
    window.open(url, "_blank");
  };

  const handleSendSms = () => {
    const text = encodeURIComponent(getPlainTextPrescription());
    const phone = patientDetails?.phone?.replace(/\D/g, '');
    let url = `sms:`;
    if (phone) {
        url += `${phone}?&body=${text}`;
    } else {
        url += `?&body=${text}`;
    }
    window.open(url);
  };


  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md w-[90vw] rounded-lg">
        <DialogHeader>
          <DialogTitle>{t('prescriptionTitle')}</DialogTitle>
          <DialogDescription>
            {t('prescriptionDescription')}
          </DialogDescription>
        </DialogHeader>
        <div className="max-h-[60vh] overflow-y-auto rounded-md border p-4 my-4 space-y-4">
            {patientDetails && (
                <div>
                    <h3 className="font-semibold">{t('patientDetailsTitle')}</h3>
                    <Separator className="my-2" />
                    <p>{t('patientName')}: {patientDetails.name}</p>
                    <p>{t('patientAge')}: {patientDetails.age}</p>
                    <p>{t('patientPhone')}: {patientDetails.phone}</p>
                    <p>{t('date')}: {new Date(prescription.date).toLocaleString()}</p>
                </div>
            )}

            <div>
                <h3 className="font-semibold">{t('diagnosisTitle')}</h3>
                <Separator className="my-2" />
                <p className="whitespace-pre-wrap">{prescription.diagnosis}</p>
            </div>

             <div>
                <h3 className="font-semibold">{t('medicinesTitle')}</h3>
                <Separator className="my-2" />
                <ul className="list-disc pl-5 space-y-1">
                    {prescription.medicines.map((med, index) => (
                        <li key={index}>
                            <span className="font-medium">{med.name}:</span> {med.dosage}
                        </li>
                    ))}
                </ul>
            </div>

            <div>
                <h3 className="font-semibold">{t('instructionsTitle')}</h3>
                <Separator className="my-2" />
                <p className="whitespace-pre-wrap">{prescription.instructions}</p>
            </div>
        </div>
        <DialogFooter className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <Button
            variant="outline"
            onClick={handleDownload}
          >
            <Download className="mr-2 h-4 w-4" />
            {t('downloadPdf')}
          </Button>
          <Button
            variant="outline"
            onClick={handleSendWhatsApp}
            disabled={!patientDetails?.phone}
          >
            <MessageSquare className="mr-2 h-4 w-4" />
            {t('sendWhatsApp')}
          </Button>
          <Button
            variant="outline"
            onClick={handleSendSms}
            disabled={!patientDetails?.phone}
          >
            <Smartphone className="mr-2 h-4 w-4" />
            {t('sendSms')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
