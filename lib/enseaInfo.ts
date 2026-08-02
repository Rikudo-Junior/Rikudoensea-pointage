export interface EnseaSlide {
  image: string;
  caption: string;
}

// Contenu factuel, sourcé du site officiel https://ensea.ed.ci/ et de la fiche
// Wikipédia de l'école — pas de chiffre ni d'affirmation non vérifiée. Les photos
// proviennent toutes du site officiel de l'ENSEA (actualités et pages institutionnelles).
export const ENSEA_SLIDES: EnseaSlide[] = [
  {
    image: "/hero-excellence.jpg",
    caption: "École Nationale Supérieure de Statistique et d'Économie Appliquée — Abidjan, Côte d'Ivoire.",
  },
  {
    image: "/hero-laptops.jpg",
    caption:
      "Le stage à l'ENSEA permet aux stagiaires de mettre en pratique les compétences acquises en statistique et en économie appliquée.",
  },
  {
    image: "/hero-campus.jpg",
    caption:
      "Centre d'excellence Banque mondiale (2015) et AFD — l'ENSEA forme des statisticiens pour l'Afrique francophone depuis 1961.",
  },
  {
    image: "/hero-group.jpg",
    caption: "Deux cycles de formation : Analyste Statisticien (AS) et Ingénieur Statisticien Économiste (ISE).",
  },
  {
    image: "/hero-event.jpg",
    caption: "Une communauté de plusieurs milliers de statisticiens formés dans plus de vingt pays d'Afrique.",
  },
  {
    image: "/hero-concours.jpg",
    caption: "Le concours d'entrée AS et ISE rassemble chaque année des candidats venus de toute l'Afrique francophone.",
  },
  {
    image: "/hero-opendays.jpg",
    caption: "Journées portes ouvertes pour présenter les filières AS et ISE aux futurs candidats.",
  },
  {
    image: "/hero-salle-info.jpg",
    caption: "Des formations pratiques en salle informatique, au cœur des méthodes statistiques modernes.",
  },
  {
    image: "/hero-ceremonie.jpg",
    caption: "Cérémonie de remise de certificats à l'amphithéâtre François Yattien-Amiguet.",
  },
  {
    image: "/hero-jpal.jpg",
    caption: "Programme de certification ENSEA / J-PAL en évaluation des politiques publiques.",
  },
  {
    image: "/hero-doctorat.jpg",
    caption: "Un programme doctoral complète les cycles ISE et AS depuis 2018.",
  },
  {
    image: "/hero-formation.jpg",
    caption: "Un accompagnement personnalisé des stagiaires tout au long de leur formation pratique.",
  },
  {
    image: "/hero-trophee.jpg",
    caption: "Les étudiants de l'ENSEA se distinguent aussi dans des compétitions technologiques.",
  },
  {
    image: "/hero-sensibilisation.jpg",
    caption: "L'ENSEA sensibilise aussi les lycéennes aux filières scientifiques et statistiques.",
  },
  {
    image: "/hero-abers.jpg",
    caption: "L'ENSEA accueille régulièrement des forums et conférences internationaux sur son campus.",
  },
];
