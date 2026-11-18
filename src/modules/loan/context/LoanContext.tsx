import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { calculateOffer } from '../utils/loanMath';

export const DOCUMENTS = [
  {
    key: 'pan',
    title: 'PAN card',
    hint: 'Front side, with a readable PAN',
    icon: 'card-account-details-outline',
  },
  {
    key: 'aadhaar',
    title: 'Aadhaar card',
    hint: 'Use a masked Aadhaar copy',
    icon: 'fingerprint',
  },
  {
    key: 'salary',
    title: 'Salary slip',
    hint: 'Your latest monthly salary slip',
    icon: 'file-document-outline',
  },
  {
    key: 'bank',
    title: 'Bank statement',
    hint: 'Your recent bank statement',
    icon: 'bank-outline',
  },
] as const;
export type DocumentKey = (typeof DOCUMENTS)[number]['key'];
export type LoanDocument = { name: string; uri?: string; sample?: boolean };
export type Personal = {
  name: string;
  dob: string;
  pan: string;
  address: string;
  permanent: string;
  sameAddress: boolean;
};
export type Employment = {
  type: string;
  income: string;
  company: string;
  designation: string;
  experience: string;
};

function useLoanState() {
  const [documents, setDocuments] = useState<
    Partial<Record<DocumentKey, LoanDocument>>
  >({});
  const [personal, setPersonal] = useState<Personal>({
    name: '',
    dob: '',
    pan: '',
    address: '',
    permanent: '',
    sameAddress: true,
  });
  const [employment, setEmployment] = useState<Employment>({
    type: 'Salaried',
    income: '',
    company: '',
    designation: '',
    experience: '',
  });
  const [amount, setAmount] = useState(100000);
  const [months, setMonths] = useState(12);
  const [paid, setPaid] = useState(0);
  const [signed, setSigned] = useState(false);
  const [mandate, setMandate] = useState(false);
  const [disbursed, setDisbursed] = useState(false);
  const [detailsReady, setDetailsReady] = useState(false);
  const [agreementAccepted, setAgreementAccepted] = useState(false);
  const [mandateAccepted, setMandateAccepted] = useState(false);
  useEffect(() => {
    if (disbursed) {
      return;
    }
    setSigned(false);
    setMandate(false);
    setAgreementAccepted(false);
    setMandateAccepted(false);
  }, [amount, months, disbursed]);
  const offer = useMemo(() => calculateOffer(amount, months), [amount, months]);
  const loadSampleDetails = useCallback(() => {
    setPersonal({
      name: 'Aarav Sharma',
      dob: '15/06/1995',
      pan: 'ABCDE1234F',
      address: '24, Lake View Road, Hyderabad, Telangana 500081',
      permanent: '',
      sameAddress: true,
    });
    setEmployment({
      type: 'Salaried',
      income: '50000',
      company: 'Sample Technologies',
      designation: 'Product designer',
      experience: '4',
    });
    setDetailsReady(true);
  }, []);
  return {
    documents,
    setDocuments,
    personal,
    setPersonal,
    employment,
    setEmployment,
    amount,
    setAmount,
    months,
    setMonths,
    offer,
    paid,
    setPaid,
    signed,
    setSigned,
    mandate,
    setMandate,
    disbursed,
    setDisbursed,
    loadSampleDetails,
    detailsReady,
    setDetailsReady,
    agreementAccepted,
    setAgreementAccepted,
    mandateAccepted,
    setMandateAccepted,
  };
}
const LoanContext = createContext<ReturnType<typeof useLoanState> | null>(null);
export function LoanProvider({ children }: { children: React.ReactNode }) {
  const value = useLoanState();
  return <LoanContext.Provider value={value}>{children}</LoanContext.Provider>;
}
export function useLoan() {
  const value = useContext(LoanContext);
  if (!value) {
    throw new Error('LoanProvider is required');
  }
  return value;
}
