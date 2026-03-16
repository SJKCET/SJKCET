export interface StudentWorkRecord {
  SUBJEK: string;
  KELAS: string;
  "NO. KAD PENGENALAN TANPA ( - )": string;
  "GURU SUBJEK": string;
  "PENYELIAAN OLEH": string;
  "TELAH DIHANTAR / DISEMAK": string;
  "TARIKH PENYEMAKAN": string;
  "ITEM 1": string;
  "ITEM 2": string;
  "ITEM 3": string;
  "ITEM 4": string;
  "ITEM 5": string;
  "ITEM 6": string;
  "JUMLAH SKOR": string;
  "KOMEN / ULASAN / CADANGAN PENAMBAHBAIKAN": string;
}

export type SheetType = 'SKOR 1.0' | 'SKOR 2.0';
