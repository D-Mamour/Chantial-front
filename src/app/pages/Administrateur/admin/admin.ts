import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface User {
  id: number;
  nom: string;
  email: string;
  role: 'Entrepreneur' | 'Bailleur' | 'Admin';
  statut: 'Actif' | 'Suspendu';
  date: string;
}

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin.html',
})
export class AdminComponent {

  users: User[] = [
    {
      id: 1,
      nom: 'Julien Dubreuil',
      email: 'j.dubreuil@batipro.ci',
      role: 'Entrepreneur',
      statut: 'Actif',
      date: '12 Mars 2025'
    },
    {
      id: 2,
      nom: 'Sylvie Kouamé',
      email: 'sylvie.k@fiprivre.com',
      role: 'Bailleur',
      statut: 'Actif',
      date: '10 Avr 2025'
    },
    {
      id: 3,
      nom: "Jean-Marc L'Hôte",
      email: 'jm.lhote@chantial.com',
      role: 'Admin',
      statut: 'Actif',
      date: '01 Jan 2025'
    },
    {
      id: 4,
      nom: 'Marc Olivier',
      email: 'm.olivier@batipro.ci',
      role: 'Entrepreneur',
      statut: 'Suspendu',
      date: '24 Fév 2025'
    }
  ];

  selectedUser = signal<User | null>(null);

  form = {
    prenom: 'Jean',
    nom: 'Dupont',
    email: 'j.dupont@batipro.ci',
    telephone: '+225 07 08 09 10',
    role: 'Entrepreneur',
    actif: true
  };

  activity = [
    {
      initials: 'JD',
      date: "Aujourd'hui, 11:32",
      text: 'Admin a créé le compte de Jean Dupont (Entrepreneur)'
    },
    {
      initials: 'MO',
      date: 'Hier, 15:44',
      text: 'Marc Olivier (Entrepreneur) a été suspendu par Admin'
    },
    {
      initials: 'SK',
      date: '22 Mai, 09:12',
      text: "Sylvie Kouamé s'est connectée à la plateforme"
    }
  ];

  editUser(user: User): void {
    this.selectedUser.set(user);

    const parts = user.nom.split(' ');

    this.form.prenom = parts[0] || '';
    this.form.nom = parts.slice(1).join(' ') || '';
    this.form.email = user.email;
    this.form.role = user.role;
    this.form.actif = user.statut === 'Actif';
  }

  createUser(): void {
    this.selectedUser.set(null);

    this.form = {
      prenom: '',
      nom: '',
      email: '',
      telephone: '',
      role: 'Entrepreneur',
      actif: true
    };
  }

  toggleUser(user: User): void {
    user.statut = user.statut === 'Actif'
      ? 'Suspendu'
      : 'Actif';
  }

  deleteUser(user: User): void {
    this.users = this.users.filter(u => u.id !== user.id);
  }

  saveUser(): void {
    console.log('Utilisateur enregistré :', this.form);
  }
}