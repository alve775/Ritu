import type { CropId, Localized } from '../domain/types';

export interface ModelReference {
  name: string;
  url: string;
}
export interface CropModelNote {
  structure: Localized;
  belowGround: Localized;
  references: ModelReference[];
}
const rice: CropModelNote = {
  structure: {
    en: 'Rice has narrow leaves and branching panicles bearing spikelets. The model uses clustered shoots and branched grain heads, rather than wheat-like spikes.',
    bn: 'ধানে সরু পাতা ও শাখাযুক্ত শীষ থাকে। মডেলে গুচ্ছ কাণ্ড ও শাখাযুক্ত শীষ দেখানো হয়েছে।',
  },
  belowGround: {
    en: 'Roots are drawn schematically. Their depth, density and water uptake have not been measured.',
    bn: 'শিকড় প্রতীকী। গভীরতা, ঘনত্ব ও পানি শোষণ পরিমাপ করা হয়নি।',
  },
  references: [
    {
      name: 'UC Davis · Rice panicle anatomy',
      url: 'https://labs.plb.ucdavis.edu/rost/rice/stems/panicle.html',
    },
    { name: 'IRRI · Rice growth phases', url: 'https://books.irri.org/0471097608_content.pdf' },
  ],
};
export const cropModelNotes: Partial<Record<CropId, CropModelNote>> = {
  boro: rice,
  aman: rice,
  wheat: {
    structure: {
      en: 'Wheat has narrow leaves and a compact spike with spikelets arranged along its axis. The illustration includes awns; their appearance varies by variety.',
      bn: 'গমে সরু পাতা ও কাণ্ডের অক্ষ বরাবর সাজানো ঘন শীষ থাকে। মডেলে শীষের সূচালো অংশ দেখানো হয়েছে; জাতভেদে চেহারা বদলায়।',
    },
    belowGround: rice.belowGround,
    references: [
      {
        name: 'University of Arizona · Wheat development stages',
        url: 'https://extension.arizona.edu/publication/wheat-development-stages',
      },
    ],
  },
  mung: {
    structure: {
      en: 'Mung bean has trifoliate leaves and elongated pods. Three leaflets form each illustrated leaf; the pods are distinct from cereal grain heads.',
      bn: 'মুগে তিন পত্রকযুক্ত পাতা ও লম্বা ফলি থাকে। প্রতিটি পাতায় তিনটি পত্রক দেখানো হয়েছে; ফলি শস্যের শীষ থেকে আলাদা।',
    },
    belowGround: {
      en: 'Roots are schematic. Nitrogen fixation and soil benefits are not simulated or quantified.',
      bn: 'শিকড় প্রতীকী। নাইট্রোজেন স্থিরীকরণ বা মাটির উপকারের অনুকরণ বা হিসাব নেই।',
    },
    references: [
      {
        name: 'University of Queensland · Mungbeans unmasked',
        url: 'https://qaafi.uq.edu.au/article/2021/02/mungbeans-unmasked',
      },
      {
        name: 'Journal of Integrated Pest Management · Mungbean morphology',
        url: 'https://academic.oup.com/jipm/article/13/1/4/6524412',
      },
    ],
  },
  potato: {
    structure: {
      en: 'Potato has compound leaves above ground. Its tubers develop on underground stems called stolons, not on the above-ground foliage.',
      bn: 'আলুর ওপরে যৌগিক পাতা থাকে। আলু মাটির নিচের স্টোলন নামের কাণ্ডে তৈরি হয়; ওপরের পাতায় নয়।',
    },
    belowGround: {
      en: 'The cutaway shows a few tubers connected to stolons. Their number, size and depth are illustrative; this is not a yield or soil-depth estimate.',
      bn: 'মাটির ভেতরের দৃশ্যে স্টোলনে যুক্ত কয়েকটি আলু আছে। সংখ্যা, আকার ও গভীরতা প্রতীকী; ফলন বা মাটির গভীরতার হিসাব নয়।',
    },
    references: [
      {
        name: 'International Potato Center · How potato grows',
        url: 'https://cipotato.org/potato/how-potato-grows/',
      },
    ],
  },
  fallow: {
    structure: {
      en: 'No crop is specified for this rest period. Bare soil in the model does not prescribe how a fallow field should be managed.',
      bn: 'এই বিরতিতে কোনো ফসল নির্ধারিত নয়। দৃশ্যের খালি মাটি বাস্তব পতিত জমির ব্যবস্থাপনার নির্দেশ নয়।',
    },
    belowGround: {
      en: 'This schematic contains no sampled soil profile or surveyed root data.',
      bn: 'এখানে মাটি পরীক্ষা বা জরিপের শিকড়ের তথ্য নেই।',
    },
    references: [],
  },
};
