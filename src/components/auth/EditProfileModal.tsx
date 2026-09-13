"use client";
/* eslint-disable @next/next/no-img-element */

import React, { useState, useRef, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  X,
  Camera,
  Trash2,
  Lock,
  User as UserIcon,
  Eye,
  EyeOff,
  Check,
  Loader2,
  ShieldCheck,
} from "lucide-react";

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function EditProfileModal({ isOpen, onClose }: EditProfileModalProps) {
  const { user, updateProfile } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [nombre, setNombre] = useState(user?.nombre || "");
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);

  const [isChangingPass, setIsChangingPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && user) {
      setNombre(user.nombre || "");
      setAvatarUrl(user.avatarUrl || "");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setIsChangingPass(false);
      setError(null);
      setSuccessMsg(null);
    }
  }, [isOpen, user]);

  if (!isOpen) return null;

  // Manejador para cargar y comprimir la imagen en Canvas
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Por favor selecciona un archivo de imagen válido (JPG, PNG, WEBP).");
      return;
    }

    // Límite de archivo crudo: 5MB
    if (file.size > 5 * 1024 * 1024) {
      setError("La imagen es demasiado grande. Elige una de máximo 5MB.");
      return;
    }

    setError(null);
    const reader = new FileReader();
    reader.onload = (readerEvent) => {
      const img = new Image();
      img.onload = () => {
        // Redimensionar a un cuadrado de max 256x256 px para optimizar almacenamiento
        const canvas = document.createElement("canvas");
        const MAX_SIZE = 256;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_SIZE) {
            height = Math.round((height * MAX_SIZE) / width);
            width = MAX_SIZE;
          }
        } else {
          if (height > MAX_SIZE) {
            width = Math.round((width * MAX_SIZE) / height);
            height = MAX_SIZE;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL("image/jpeg", 0.85);
          setAvatarUrl(compressedDataUrl);
        }
      };
      img.src = readerEvent.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveAvatar = () => {
    setAvatarUrl("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    const cleanNombre = nombre.trim();
    if (!cleanNombre || cleanNombre.length < 2) {
      setError("Tu nombre debe tener al menos 2 caracteres.");
      return;
    }

    if (isChangingPass) {
      if (!currentPassword) {
        setError("Debes ingresar tu contraseña actual para cambiarla.");
        return;
      }
      if (!newPassword || newPassword.length < 6) {
        setError("La nueva contraseña debe tener al menos 6 caracteres.");
        return;
      }
      if (newPassword !== confirmPassword) {
        setError("Las contraseñas nuevas no coinciden.");
        return;
      }
    }

    setLoading(true);
    try {
      const payload: {
        nombre: string;
        avatarUrl?: string;
        currentPassword?: string;
        newPassword?: string;
      } = {
        nombre: cleanNombre,
        avatarUrl: avatarUrl,
      };

      if (isChangingPass && newPassword) {
        payload.currentPassword = currentPassword;
        payload.newPassword = newPassword;
      }

      const result = await updateProfile(payload);
      if (!result.success) {
        setError(result.error || "Ocurrió un error al actualizar el perfil.");
      } else {
        setSuccessMsg("¡Perfil actualizado con éxito!");
        setTimeout(() => {
          onClose();
        }, 1200);
      }
    } catch (err: any) {
      setError(err.message || "Error al conectar con el servidor.");
    } finally {
      setLoading(false);
    }
  };

  const initial = (nombre?.charAt(0) || user?.nombre?.charAt(0) || "U").toUpperCase();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/50 backdrop-blur-sm animate-fadeIn">
      <div className="bg-card w-full max-w-md rounded-3xl shadow-2xl border border-line overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header del Modal */}
        <div className="px-6 py-5 border-b border-line flex items-center justify-between bg-sky-50/50">
          <div>
            <h3 className="font-serif font-bold text-xl text-ink">Modificar Perfil</h3>
            <p className="text-xs text-ink-soft">Actualiza tus datos, foto y contraseña</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full hover:bg-ink/5 text-ink-soft hover:text-ink transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6 flex-1">
          {error && (
            <div className="p-3 bg-blush-50 border border-blush-200 text-blush-700 text-xs rounded-xl flex items-center gap-2">
              <span className="font-bold">Error:</span> {error}
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-xl flex items-center gap-2">
              <Check size={16} className="shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Sección de Foto de Perfil */}
          <div className="flex flex-col items-center justify-center gap-3">
            <div className="relative group">
              <div className="w-24 h-24 rounded-full overflow-hidden border-3 border-sky-400/30 shadow-md bg-sky-100 flex items-center justify-center text-sky-700 text-3xl font-serif font-bold">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt="Foto de perfil"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  initial
                )}
              </div>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                title="Cambiar foto de perfil"
                className="absolute bottom-0 right-0 p-2 bg-sky-600 text-white rounded-full shadow-lg hover:bg-sky-700 transition-transform active:scale-95 cursor-pointer"
              >
                <Camera size={16} />
              </button>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageChange}
            />

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-xs font-semibold text-sky-700 hover:text-sky-800 hover:underline"
              >
                {avatarUrl ? "Cambiar foto" : "Subir foto"}
              </button>
              {avatarUrl && (
                <>
                  <span className="text-line">|</span>
                  <button
                    type="button"
                    onClick={handleRemoveAvatar}
                    className="text-xs font-semibold text-blush-600 hover:text-blush-700 hover:underline inline-flex items-center gap-1"
                  >
                    <Trash2 size={12} />
                    <span>Eliminar</span>
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Campo: Nombre */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-ink-soft uppercase tracking-wider">
              Nombre
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-ink-soft">
                <UserIcon size={16} />
              </div>
              <input
                type="text"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Tu nombre"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-line bg-card/60 text-ink text-sm focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-transparent transition-all"
                required
              />
            </div>
          </div>

          {/* Campo de Solo Lectura: Rol y Correo */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-2.5 rounded-xl bg-sky-50/50 border border-line">
              <span className="text-ink-soft block text-[10px] uppercase font-bold">Rol</span>
              <span className="font-semibold text-sky-900 capitalize">
                {user?.rol === "novio" ? "Novio" : "Novia"}
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-sky-50/50 border border-line truncate">
              <span className="text-ink-soft block text-[10px] uppercase font-bold">Correo</span>
              <span className="font-medium text-ink truncate block" title={user?.email}>
                {user?.email}
              </span>
            </div>
          </div>

          {/* Toggle para cambiar contraseña */}
          <div className="border-t border-line pt-4">
            <button
              type="button"
              onClick={() => setIsChangingPass(!isChangingPass)}
              className="flex items-center justify-between w-full text-xs font-semibold text-sky-800 hover:text-sky-900 py-1.5 px-2 rounded-lg hover:bg-sky-50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Lock size={15} />
                <span>¿Deseas cambiar tu contraseña?</span>
              </div>
              <span className="text-xs bg-sky-100 text-sky-800 px-2 py-0.5 rounded-md">
                {isChangingPass ? "Cancelar" : "Modificar"}
              </span>
            </button>

            {isChangingPass && (
              <div className="mt-3 space-y-3.5 p-4 rounded-2xl bg-sky-50/40 border border-sky-200/60 animate-fadeIn">
                <div className="flex items-center gap-1.5 text-[11px] text-sky-800 font-medium">
                  <ShieldCheck size={14} />
                  <span>Seguridad de la cuenta</span>
                </div>

                {/* Contraseña Actual */}
                <div className="space-y-1">
                  <label className="block text-[11px] font-semibold text-ink-soft">
                    Contraseña actual
                  </label>
                  <div className="relative">
                    <input
                      type={showCurrentPass ? "text" : "password"}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Tu contraseña actual"
                      className="w-full pr-10 pl-3 py-2 text-xs rounded-xl border border-line bg-white text-ink focus:outline-none focus:ring-2 focus:ring-sky-400"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPass(!showCurrentPass)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-soft hover:text-ink"
                    >
                      {showCurrentPass ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>

                {/* Nueva Contraseña */}
                <div className="space-y-1">
                  <label className="block text-[11px] font-semibold text-ink-soft">
                    Nueva contraseña (mínimo 6 caracteres)
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPass ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Nueva contraseña"
                      className="w-full pr-10 pl-3 py-2 text-xs rounded-xl border border-line bg-white text-ink focus:outline-none focus:ring-2 focus:ring-sky-400"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPass(!showNewPass)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-soft hover:text-ink"
                    >
                      {showNewPass ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>

                {/* Confirmar Nueva Contraseña */}
                <div className="space-y-1">
                  <label className="block text-[11px] font-semibold text-ink-soft">
                    Confirmar nueva contraseña
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPass ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Repite la nueva contraseña"
                      className="w-full pr-10 pl-3 py-2 text-xs rounded-xl border border-line bg-white text-ink focus:outline-none focus:ring-2 focus:ring-sky-400"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPass(!showConfirmPass)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-soft hover:text-ink"
                    >
                      {showConfirmPass ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Acciones */}
          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-xs font-semibold text-ink-soft hover:text-ink bg-card border border-line rounded-xl hover:bg-stone-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-xl shadow-md hover:shadow-lg transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  <span>Guardando...</span>
                </>
              ) : (
                <span>Guardar cambios</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
