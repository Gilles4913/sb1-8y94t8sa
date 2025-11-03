import { useState, useEffect } from 'react';
import { Mail, Edit2, Save, X, Copy, Check } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useToast } from '../contexts/ToastContext';
import { Layout } from './Layout';

interface EmailTemplate {
  id: string;
  tenant_id: string | null;
  type: string;
  subject: string;
  html_body: string;
  text_body: string;
  placeholders: string[];
  is_active: boolean;
  updated_at: string;
}

const TEMPLATE_TYPE_LABELS: Record<string, string> = {
  invitation: 'Invitation initiale',
  reminder_5d: 'Rappel 5 jours',
  reminder_10d: 'Rappel 10 jours',
  confirmation: 'Confirmation de réponse',
  sponsor_ack: 'Accusé réception sponsor',
  campaign_summary: 'Résumé de campagne',
};

export function SuperAdminEmailTemplates() {
  const toast = useToast();
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<EmailTemplate>>({});
  const [saving, setSaving] = useState(false);
  const [duplicating, setDuplicating] = useState<string | null>(null);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('email_templates')
        .select('*')
        .is('tenant_id', null)
        .order('type');

      if (error) throw error;

      setTemplates(
        data.map((t) => ({
          ...t,
          placeholders: Array.isArray(t.placeholders)
            ? t.placeholders
            : JSON.parse(t.placeholders || '[]'),
        }))
      );
    } catch (error) {
      console.error('Error fetching templates:', error);
      toast.error('Erreur lors du chargement des templates');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (template: EmailTemplate) => {
    setEditingId(template.id);
    setEditForm({
      subject: template.subject,
      html_body: template.html_body,
      text_body: template.text_body,
      is_active: template.is_active,
    });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditForm({});
  };

  const handleSave = async (templateId: string) => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('email_templates')
        .update({
          subject: editForm.subject,
          html_body: editForm.html_body,
          text_body: editForm.text_body,
          is_active: editForm.is_active,
        })
        .eq('id', templateId);

      if (error) throw error;

      toast.success('Template sauvegardé avec succès');
      setEditingId(null);
      setEditForm({});
      await fetchTemplates();
    } catch (error) {
      console.error('Error saving template:', error);
      toast.error('Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  const handleDuplicateToAllClubs = async (template: EmailTemplate) => {
    if (!confirm('Voulez-vous vraiment dupliquer ce template vers tous les clubs existants ? Cette opération écrasera leurs templates existants de ce type.')) {
      return;
    }

    setDuplicating(template.id);
    try {
      const { data: tenants, error: tenantsError } = await supabase
        .from('tenants')
        .select('id');

      if (tenantsError) throw tenantsError;

      if (!tenants || tenants.length === 0) {
        toast.info('Aucun club trouvé');
        return;
      }

      let successCount = 0;
      let errorCount = 0;

      for (const tenant of tenants) {
        try {
          const { data: existing, error: checkError } = await supabase
            .from('email_templates')
            .select('id')
            .eq('tenant_id', tenant.id)
            .eq('type', template.type)
            .maybeSingle();

          if (checkError) throw checkError;

          if (existing) {
            const { error: updateError } = await supabase
              .from('email_templates')
              .update({
                subject: template.subject,
                html_body: template.html_body,
                text_body: template.text_body,
                placeholders: template.placeholders,
                is_active: template.is_active,
              })
              .eq('id', existing.id);

            if (updateError) throw updateError;
          } else {
            const { error: insertError } = await supabase
              .from('email_templates')
              .insert({
                tenant_id: tenant.id,
                type: template.type,
                subject: template.subject,
                html_body: template.html_body,
                text_body: template.text_body,
                placeholders: template.placeholders,
                is_active: template.is_active,
              });

            if (insertError) throw insertError;
          }

          successCount++;
        } catch (error) {
          console.error(`Error duplicating to tenant ${tenant.id}:`, error);
          errorCount++;
        }
      }

      if (errorCount === 0) {
        toast.success(`Template dupliqué vers ${successCount} club(s)`);
      } else {
        toast.error(`${successCount} réussi(s), ${errorCount} erreur(s)`);
      }
    } catch (error) {
      console.error('Error duplicating template:', error);
      toast.error('Erreur lors de la duplication');
    } finally {
      setDuplicating(null);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center py-12">
          <div className="text-slate-600 dark:text-slate-400">Chargement...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-3 rounded-xl shadow-lg">
              <Mail className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
                Modèles e-mails par défaut
              </h1>
              <p className="text-slate-600 dark:text-slate-400">
                Gérez les templates par défaut utilisés par tous les clubs
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {templates.length === 0 ? (
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-12 text-center">
              <Mail className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <p className="text-slate-600 dark:text-slate-400">
                Aucun template par défaut trouvé
              </p>
            </div>
          ) : (
            templates.map((template) => (
              <div
                key={template.id}
                className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                          {TEMPLATE_TYPE_LABELS[template.type] || template.type}
                        </h3>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            template.is_active
                              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                              : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400'
                          }`}
                        >
                          {template.is_active ? 'Actif' : 'Inactif'}
                        </span>
                      </div>
                      {editingId !== template.id && (
                        <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                          Sujet : {template.subject}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {editingId === template.id ? (
                        <>
                          <button
                            onClick={() => handleSave(template.id)}
                            disabled={saving}
                            className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 disabled:bg-slate-400 text-white rounded-lg transition"
                          >
                            <Save className="w-4 h-4" />
                            {saving ? 'Sauvegarde...' : 'Sauvegarder'}
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            disabled={saving}
                            className="flex items-center gap-2 px-4 py-2 bg-slate-300 hover:bg-slate-400 dark:bg-slate-600 dark:hover:bg-slate-500 text-slate-800 dark:text-white rounded-lg transition"
                          >
                            <X className="w-4 h-4" />
                            Annuler
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => handleEdit(template)}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition"
                          >
                            <Edit2 className="w-4 h-4" />
                            Éditer
                          </button>
                          <button
                            onClick={() => handleDuplicateToAllClubs(template)}
                            disabled={duplicating === template.id}
                            className="flex items-center gap-2 px-4 py-2 bg-purple-500 hover:bg-purple-600 disabled:bg-slate-400 text-white rounded-lg transition"
                          >
                            <Copy className="w-4 h-4" />
                            {duplicating === template.id ? 'Duplication...' : 'Dupliquer vers clubs'}
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {editingId === template.id && (
                    <div className="space-y-4 mt-4 border-t border-slate-200 dark:border-slate-700 pt-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                          Statut
                        </label>
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={editForm.is_active ?? false}
                            onChange={(e) =>
                              setEditForm({ ...editForm, is_active: e.target.checked })
                            }
                            className="w-4 h-4 text-blue-500 border-slate-300 rounded focus:ring-2 focus:ring-blue-500"
                          />
                          <span className="text-sm text-slate-700 dark:text-slate-300">
                            Template actif
                          </span>
                        </label>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                          Sujet
                        </label>
                        <input
                          type="text"
                          value={editForm.subject || ''}
                          onChange={(e) =>
                            setEditForm({ ...editForm, subject: e.target.value })
                          }
                          className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:outline-none bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                          Corps HTML
                        </label>
                        <textarea
                          value={editForm.html_body || ''}
                          onChange={(e) =>
                            setEditForm({ ...editForm, html_body: e.target.value })
                          }
                          rows={10}
                          className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:outline-none bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-mono text-sm resize-y"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                          Corps texte brut
                        </label>
                        <textarea
                          value={editForm.text_body || ''}
                          onChange={(e) =>
                            setEditForm({ ...editForm, text_body: e.target.value })
                          }
                          rows={8}
                          className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:outline-none bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-mono text-sm resize-y"
                        />
                      </div>

                      {template.placeholders && template.placeholders.length > 0 && (
                        <div>
                          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                            Variables disponibles
                          </label>
                          <div className="flex flex-wrap gap-2">
                            {template.placeholders.map((placeholder) => (
                              <span
                                key={placeholder}
                                className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full text-xs font-mono"
                              >
                                {`{{${placeholder}}}`}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </Layout>
  );
}
