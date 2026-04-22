import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonIcon, ToastController, ModalController, IonModal, AlertController } from '@ionic/angular/standalone';
import { Router } from '@angular/router';
import { addIcons } from 'ionicons';
import { 
  arrowBackOutline, addOutline, createOutline, trashOutline,
  calendarOutline, newspaperOutline,
  informationCircleOutline, warningOutline, checkmarkCircleOutline,
  closeOutline, imageOutline, cloudUploadOutline, trashBinOutline
} from 'ionicons/icons';
import { SupabaseService } from '../../../services/supabase/supabase.service';

@Component({
  selector: 'app-publications',
  templateUrl: './publications.page.html',
  styleUrls: ['./publications.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule, IonIcon, IonModal]
})
export class PublicationsPage implements OnInit {

  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  publications: any[] = [];
  isModalOpen: boolean = false;
  isEditing: boolean = false;
  editingId: string | null = null;
  isUploading: boolean = false;
  uploadProgress: number = 0;
  userId: string = '';
  userIsAdmin: boolean = false;
  
  formData = {
    title: '',
    content: '',
    type: 'info',
    image_url: ''
  };

  constructor(
    private router: Router,
    private supabaseService: SupabaseService,
    private toastCtrl: ToastController,
    private alertCtrl: AlertController
  ) {
    addIcons({
      arrowBackOutline, addOutline, createOutline, trashOutline,
      calendarOutline, newspaperOutline,
      informationCircleOutline, warningOutline, checkmarkCircleOutline,
      closeOutline, imageOutline, cloudUploadOutline, trashBinOutline
    });
  }

  async ngOnInit() {
    await this.checkUser();
    await this.loadPublications();
  }

  // 🔥 FANAMARINANA USER AMIN'NY LOCALSTORAGE
  async checkUser() {
    try {
      const userId = localStorage.getItem('userId');
      const userPhone = localStorage.getItem('userPhone');
      
      console.log('📱 User ID from storage:', userId);
      console.log('📱 User Phone from storage:', userPhone);
      
      if (!userId) {
        this.showToast('Utilisateur non trouvé. Veuillez vous reconnecter.', 'danger');
        this.userIsAdmin = false;
        return;
      }
      
      this.userId = userId;
      
      // 🔥 Maka ny info user avy amin'ny DB
      const { data: user, error } = await this.supabaseService.supabase
        .from('users')
        .select('is_admin, vip_level')
        .eq('id', userId)
        .single();
      
      if (error) {
        console.error('Error fetching user:', error);
        this.userIsAdmin = false;
        return;
      }
      
      this.userIsAdmin = user?.is_admin === true;
      console.log('👑 User is admin:', this.userIsAdmin);
      
      if (!this.userIsAdmin) {
        this.showToast('Vous n\'avez pas les droits administrateur', 'warning');
      }
      
    } catch (err) {
      console.error('Check user error:', err);
      this.userIsAdmin = false;
    }
  }

  triggerFileInput() {
    if (!this.userIsAdmin) {
      this.showToast('Vous devez être administrateur', 'danger');
      return;
    }
    if (this.fileInput) {
      this.fileInput.nativeElement.click();
    }
  }

  async loadPublications() {
    try {
      const { data, error } = await this.supabaseService.supabase
        .from('publications')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      this.publications = data || [];
      
    } catch (err) {
      console.error('Error loading publications:', err);
      this.showToast('Erreur de chargement', 'danger');
    }
  }

  openAddPublicationModal() {
    if (!this.userIsAdmin) {
      this.showToast('Accès refusé. Vous devez être administrateur.', 'danger');
      return;
    }
    
    this.isEditing = false;
    this.editingId = null;
    this.formData = {
      title: '',
      content: '',
      type: 'info',
      image_url: ''
    };
    this.isModalOpen = true;
  }

  editPublication(pub: any) {
    if (!this.userIsAdmin) {
      this.showToast('Accès refusé. Vous devez être administrateur.', 'danger');
      return;
    }
    
    this.isEditing = true;
    this.editingId = pub.id;
    this.formData = {
      title: pub.title,
      content: pub.content,
      type: pub.type,
      image_url: pub.image_url || ''
    };
    this.isModalOpen = true;
  }

  async uploadImage(event: any) {
    const file = event.target.files[0];
    if (!file) return;

    if (!this.userIsAdmin) {
      this.showToast('Vous devez être administrateur', 'danger');
      return;
    }

    if (!file.type.startsWith('image/')) {
      this.showToast('Veuillez sélectionner une image', 'warning');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      this.showToast('L\'image ne doit pas dépasser 5MB', 'warning');
      return;
    }

    this.isUploading = true;
    this.uploadProgress = 0;

    try {
      const interval = setInterval(() => {
        if (this.uploadProgress < 90) {
          this.uploadProgress += 10;
        }
      }, 200);

      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
      const filePath = `${fileName}`;

      const { data, error } = await this.supabaseService.supabase.storage
        .from('publication-images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      clearInterval(interval);
      this.uploadProgress = 100;

      if (error) {
        console.error('Upload error:', error);
        this.showToast('Erreur lors de l\'upload', 'danger');
        return;
      }

      const { data: urlData } = this.supabaseService.supabase.storage
        .from('publication-images')
        .getPublicUrl(filePath);

      this.formData.image_url = urlData.publicUrl;
      this.showToast('✅ Image téléchargée avec succès', 'success');

      if (this.fileInput) {
        this.fileInput.nativeElement.value = '';
      }

    } catch (error: any) {
      console.error('Error uploading image:', error);
      this.showToast(error.message || 'Erreur lors du téléchargement', 'danger');
    } finally {
      setTimeout(() => {
        this.isUploading = false;
        this.uploadProgress = 0;
      }, 500);
    }
  }

  async removeImage() {
    const alert = await this.alertCtrl.create({
      header: 'Supprimer l\'image',
      message: 'Voulez-vous vraiment supprimer cette image ?',
      buttons: [
        { text: 'Annuler', role: 'cancel' },
        { 
          text: 'Supprimer', 
          role: 'destructive',
          handler: () => {
            this.formData.image_url = '';
            this.showToast('Image supprimée', 'success');
          }
        }
      ]
    });
    await alert.present();
  }

  async savePublication() {
    if (!this.userIsAdmin) {
      this.showToast('Accès refusé. Vous devez être administrateur.', 'danger');
      return;
    }
    
    if (!this.formData.title || !this.formData.content) {
      this.showToast('Veuillez remplir tous les champs', 'warning');
      return;
    }

    try {
      if (this.isEditing && this.editingId) {
        const { error } = await this.supabaseService.supabase
          .from('publications')
          .update({
            title: this.formData.title,
            content: this.formData.content,
            type: this.formData.type,
            image_url: this.formData.image_url || null,
            updated_at: new Date().toISOString()
          })
          .eq('id', this.editingId);

        if (error) throw error;
        this.showToast('Publication modifiée avec succès', 'success');
        
      } else {
        const { error } = await this.supabaseService.supabase
          .from('publications')
          .insert({
            title: this.formData.title,
            content: this.formData.content,
            type: this.formData.type,
            image_url: this.formData.image_url || null,
            created_at: new Date().toISOString()
          });

        if (error) throw error;
        this.showToast('Publication ajoutée avec succès', 'success');
      }

      this.closeModal();
      await this.loadPublications();
      
    } catch (err: any) {
      console.error('Error saving publication:', err);
      this.showToast(err.message || 'Erreur lors de l\'enregistrement', 'danger');
    }
  }

  async deletePublication(pub: any) {
    if (!this.userIsAdmin) {
      this.showToast('Accès refusé. Vous devez être administrateur.', 'danger');
      return;
    }
    
    const alert = await this.alertCtrl.create({
      header: 'Supprimer',
      message: 'Voulez-vous vraiment supprimer cette publication ?',
      buttons: [
        { text: 'Annuler', role: 'cancel' },
        { 
          text: 'Supprimer', 
          role: 'destructive',
          handler: async () => {
            try {
              const { error } = await this.supabaseService.supabase
                .from('publications')
                .delete()
                .eq('id', pub.id);

              if (error) throw error;
              
              this.showToast('Publication supprimée avec succès', 'success');
              await this.loadPublications();
            } catch (err: any) {
              console.error('Error deleting publication:', err);
              this.showToast(err.message || 'Erreur lors de la suppression', 'danger');
            }
          }
        }
      ]
    });
    await alert.present();
  }

  closeModal() {
    this.isModalOpen = false;
    this.isUploading = false;
    this.uploadProgress = 0;
  }

  getIconName(type: string): string {
    switch(type) {
      case 'warning': return 'warning-outline';
      case 'success': return 'checkmark-circle-outline';
      case 'event': return 'calendar-outline';
      default: return 'information-circle-outline';
    }
  }

  getTypeText(type: string): string {
    switch(type) {
      case 'warning': return 'Alerte';
      case 'success': return 'Succès';
      case 'event': return 'Événement';
      default: return 'Information';
    }
  }

  goBack() {
    this.router.navigate(['/tabs/acceuil']);
  }

  async showToast(message: string, color: string) {
    const toast = await this.toastCtrl.create({
      message,
      duration: 2000,
      color: color as any,
      position: 'bottom'
    });
    await toast.present();
  }
}