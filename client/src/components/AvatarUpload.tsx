import { FC, useRef, useState } from 'react';
import { Upload, X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { instance } from '../api/axios.api';

interface AvatarUploadProps {
    currentAvatar?: string;
    username?: string;
    onAvatarChange: (newAvatarUrl: string) => void;
}

const AvatarUpload: FC<AvatarUploadProps> = ({ currentAvatar, username, onAvatarChange }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    const getAvatarUrl = (avatar?: string): string | null => {
        if (!avatar || avatar === 'default.png') return null;
        if (avatar.startsWith('http')) return avatar;
        if (avatar.startsWith('/avatars/')) {
            return avatar;
        }
        return null;
    };

    const avatarUrl = getAvatarUrl(currentAvatar);

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 5 * 1024 * 1024) {
            toast.error('Файл не должен превышать 5 МБ');
            return;
        }

        if (!file.type.startsWith('image/')) {
            toast.error('Файл должен быть изображением');
            return;
        }

        const preview = URL.createObjectURL(file);
        setPreviewUrl(preview);

        setIsUploading(true);
        try {
            const formData = new FormData();
            formData.append('avatar', file);

            const { data } = await instance.post('/storage/avatar', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            onAvatarChange(data.avatarUrl);
            toast.success('Аватар загружен');
            setPreviewUrl(null);
        } catch (err: any) {
            const msg = Array.isArray(err.response?.data?.message)
                ? err.response.data.message.join('. ')
                : err.response?.data?.message || 'Ошибка загрузки';
            toast.error(msg);
            setPreviewUrl(null);
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    const handleRemoveAvatar = async () => {
        setIsUploading(true);
        try {
            await instance.delete('/storage/avatar');
            onAvatarChange('default.png');
            toast.success('Аватар удалён');
        } catch (err: any) {
            const msg = Array.isArray(err.response?.data?.message)
                ? err.response.data.message.join('. ')
                : err.response?.data?.message || 'Ошибка удаления';
            toast.error(msg);
        } finally {
            setIsUploading(false);
        }
    };

    const handleClick = () => {
        fileInputRef.current?.click();
    };

    return (
        <div className="relative group">
            <div
                onClick={handleClick}
                className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden cursor-pointer shadow-lg dark:shadow-gray-900/50 transition-all hover:shadow-xl flex-shrink-0"
            >
                {previewUrl ? (
                    <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                ) : avatarUrl ? (
                    <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                    <div className="w-full h-full bg-gradient-to-br from-[#3D5B82] to-[#96C3D6] flex items-center justify-center">
                        <span className="text-3xl sm:text-4xl font-bold text-white">
                            {username?.[0]?.toUpperCase() || '?'}
                        </span>
                    </div>
                )}

                {isUploading && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-2xl">
                        <Loader2 className="w-8 h-8 text-white animate-spin" />
                    </div>
                )}

                {!isUploading && (
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all rounded-2xl flex items-center justify-center opacity-0 group-hover:opacity-100">
                        <Upload className="w-8 h-8 text-white" />
                    </div>
                )}
            </div>

            {avatarUrl && !isUploading && (
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveAvatar();
                    }}
                    className="absolute -top-1 -right-1 w-6 h-6 min-w-0 min-h-0 bg-red-100 hover:bg-red-200 dark:bg-red-900/40 dark:hover:bg-red-900/60 text-red-700 dark:text-red-300 rounded-full flex items-center justify-center shadow transition-colors opacity-0 group-hover:opacity-100"
                    aria-label="Удалить аватар"
                >
                    <X className="w-2.5 h-2.5" />
                </button>
            )}

            <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleFileSelect}
                className="hidden"
            />
        </div>
    );
};

export default AvatarUpload;