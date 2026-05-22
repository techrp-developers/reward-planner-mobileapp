const PropertyTaxSvg = require('../../assete/ServiceData/bike_incerance.png');
const RentAgreementSvg = require('../../assete/ServiceData/bike_incerance.png');
const IncomeNoticeSvg = require('../../assete/ServiceData/bike_incerance.png');

const PanCardSvg = require('../../assete/ServiceData/passport.png');
const AadhaarSvg = require('../../assete/ServiceData/bike_incerance.png');
const DrivingLicenseSvg = require('../../assete/ServiceData/bike_incerance.png');

const HealthInsuranceSvg = require('../../assete/ServiceData/bike_incerance.png');
const LifeInsuranceSvg = require('../../assete/ServiceData/bike_incerance.png');
const MutualFundsSvg = require('../../assete/ServiceData/bike_incerance.png');

const ItrFilingSvg = require('../../assete/ServiceData/bike_incerance.png');

export const ServiceData = [
  /* ================= PROPERTY / LEGAL ================= */
  {
    id: '1',
    title: 'Property Tax Name Change',
    desc: 'Required as ownership proof for MSEB name change.',
    rating: 4.8,
    reviews: '18.9k',
    price: '₹3700',
    discount: '₹300',
    Image: PropertyTaxSvg,
  },
  {
    id: '2',
    title: 'Rent Agreement',
    desc: 'Mandatory if the electricity connection is rented.',
    rating: 4.9,
    reviews: '18.9k',
    price: '₹600',
    discount: '₹100',
    Image: RentAgreementSvg,
  },
  {
    id: '3',
    title: 'Reply to Income Notice',
    desc: 'For PAN-related income tax notices.',
    rating: 4.7,
    reviews: '12.1k',
    price: '₹1000',
    discount: '₹200',
    Image: IncomeNoticeSvg,
  },

  /* ================= IDENTITY SERVICES ================= */
  {
    id: '4',
    title: 'PAN Card Services',
    desc: 'New PAN, correction, or reprint. End-to-end support.',
    rating: 4.8,
    reviews: '18.9k',
    price: '₹150',
    discount: '₹25',
    Image: PanCardSvg,
  },
  {
    id: '5',
    title: 'Aadhaar Update & Correction',
    desc: 'Name, address, DOB updates with documentation.',
    rating: 4.8,
    reviews: '18.9k',
    price: '₹100',
    discount: '₹50',
    Image: AadhaarSvg,
  },
  {
    id: '6',
    title: 'Driving License Services',
    desc: 'New license, renewal, address change & updates.',
    rating: 4.7,
    reviews: '18.9k',
    price: '₹3500',
    discount: '₹500',
    Image: DrivingLicenseSvg,
  },

  /* ================= INSURANCE & INVESTMENT ================= */
  {
    id: '7',
    title: 'Health Insurance',
    desc: 'Tax-saving under section 80D.',
    rating: 4.6,
    reviews: '18.9k',
    cta: 'Get Started',
    Image: HealthInsuranceSvg,
  },
  {
    id: '8',
    title: 'Life Insurance',
    desc: 'Long-term tax benefits and financial security.',
    rating: 4.7,
    reviews: '18.9k',
    cta: 'Get Started',
    Image: LifeInsuranceSvg,
  },
  {
    id: '9',
    title: 'Mutual Funds',
    desc: 'Save tax while investing smartly.',
    rating: 4.8,
    reviews: '18.9k',
    cta: 'Get Started',
    Image: MutualFundsSvg,
  },

  /* ================= TAX & FINANCE ================= */
  {
    id: '10',
    title: 'ITR Filing',
    desc: 'PAN is mandatory for filing income tax returns.',
    rating: 4.8,
    reviews: '18.9k',
    price: '₹800',
    discount: '₹200',
    Image: ItrFilingSvg,
  },
];
