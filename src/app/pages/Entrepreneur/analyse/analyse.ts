import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-analyses',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './analyse.html',
  styleUrl: './analyse.css'
})
export class AnalysesComponent {

  selectedProject = 'Villa Almadies 2026';

  projects = [
    'Villa Almadies 2026',
    'Immeuble R+3 Parcelles',
    'Maison familiale Rufisque'
  ];

  stats = [
    {
      label: 'Budget prévisionnel',
      value: '50 000 000 FCFA',
      color: 'text-[#64748B]'
    },
    {
      label: 'Dépenses réalisées',
      value: '32 000 000 FCFA',
      color: 'text-[#0797D5]'
    },
    {
      label: 'Avancement global',
      value: '55 %',
      color: 'text-[#10B981]'
    },
    {
      label: 'Risque de retard',
      value: 'MODÉRÉ',
      color: 'text-[#F59E0B]'
    }
  ];

  risks = [
    {
      name: 'Élévation',
      status: 'Retard +6 jours',
      percentage: 65,
      color: 'bg-[#F59E0B]',
      statusColor: 'text-[#F87171]'
    },
    {
      name: 'Toiture',
      status: 'À surveiller',
      percentage: 50,
      color: 'bg-[#0797D5]',
      statusColor: 'text-[#F59E0B]'
    }
  ];

  anomalies = [
    {
      title: 'Écart OCR de 50 000 FCFA sur une facture',
      detail: 'Étape : Fondations • Vérification recommandée',
      color: 'bg-[#EF4444]'
    },
    {
      title: 'Dépenses supérieures à l’avancement déclaré',
      detail: 'Étape : Élévation • Attention requise',
      color: 'bg-[#F59E0B]'
    }
  ];

  recommendations = [
    {
      title: 'Action recommandée',
      description: 'Vérifier les dépenses de l’étape Élévation avant validation.',
      color: 'bg-[#EAF7FD]',
      titleColor: 'text-[#0797D5]'
    },
    {
      title: 'Prévision',
      description: 'Le rythme actuel peut entraîner un retard de 5 à 8 jours.',
      color: 'bg-[#F2F0FF]',
      titleColor: 'text-[#6366F1]'
    }
  ];

  onProjectChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.selectedProject = select.value;
  }

}