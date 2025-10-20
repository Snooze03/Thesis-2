import { useState, useRef, useEffect } from "react";
import { Camera } from "react-camera-pro";
import { Card, CardContent, CardAction } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Camera as CameraIcon, X, Check, Trash2 } from "lucide-react";
import { useProgressPhoto } from "@/hooks/profile/useProgressPhoto";
import { toast } from "react-hot-toast";
import { PersonStanding } from "lucide-react";
import { BicepsFlexed } from "lucide-react";

function BeforeAndAfterPicture() {
    const [isCamera, setIsCamera] = useState(false);
    const [beforeImage, setBeforeImage] = useState(null);
    const [afterImage, setAfterImage] = useState(null);
    const [currentImageType, setCurrentImageType] = useState(null);
    const camera = useRef(null);

    const {
        uploadBeforePhoto,
        uploadAfterPhoto,
        removeBeforePhoto,
        removeAfterPhoto,
        progressPhotos,
        isLoading
    } = useProgressPhoto();


    // Load existing photos when component mounts
    useEffect(() => {
        if (progressPhotos) {
            if (progressPhotos.before_photo_url) {
                setBeforeImage(progressPhotos.before_photo_url);
            }
            if (progressPhotos.after_photo_url) {
                setAfterImage(progressPhotos.after_photo_url);
            }
        }
    }, [progressPhotos]);

    const takePhoto = async () => {
        try {
            const photo = camera.current.takePhoto();

            if (currentImageType === 'before') {
                setBeforeImage(photo);
                // Upload immediately
                await uploadBeforePhoto.mutateAsync({
                    photo: photo,
                    date_before: new Date().toISOString().split('T')[0] // Today's date
                });
                toast.success('Before photo uploaded successfully!');
            } else if (currentImageType === 'after') {
                setAfterImage(photo);
                // Upload immediately
                await uploadAfterPhoto.mutateAsync({
                    photo: photo,
                    date_after: new Date().toISOString().split('T')[0] // Today's date
                });
                toast.success('After photo uploaded successfully!');
            }
        } catch (error) {
            toast.error('Failed to upload photo. Please try again.');
            console.error('Upload error:', error);
        }

        setIsCamera(false);
        setCurrentImageType(null);
    };

    const startCamera = (imageType) => {
        setCurrentImageType(imageType);
        setIsCamera(true);
    };

    const handleRemovePhoto = async (photoType) => {
        try {
            if (photoType === 'before') {
                await removeBeforePhoto.mutateAsync();
                setBeforeImage(null);
                toast.success('Before photo removed successfully!');
            } else {
                await removeAfterPhoto.mutateAsync();
                setAfterImage(null);
                toast.success('After photo removed successfully!');
            }
        } catch (error) {
            toast.error('Failed to remove photo. Please try again.');
            console.error('Remove error:', error);
        }
    };


    if (isCamera) {
        return (
            <Card>
                <CardContent>
                    <div className="flex flex-col gap-4">
                        {/* <div className="w-xs self-center bg-orange-200 rounded-xl px-4 py-1 "> */}
                        <h3 className="text-md font-semibold text-center">
                            Take {currentImageType} picture
                        </h3>
                        {/* </div> */}

                        <Camera
                            ref={camera}
                            aspectRatio={4 / 3}
                            facingMode="user"
                            errorMessages={{
                                noCameraAccessible: 'No camera device accessible. Please connect your camera or try a different browser.',
                                permissionDenied: 'Permission denied. Please refresh and give camera permission.',
                                switchCamera: 'It is not possible to switch camera to different one because there is only one video device accessible.',
                                canvas: 'Canvas is not supported.'
                            }}
                        />

                        <div className="grid grid-cols-2 gap-3 mt-1">
                            <Button
                                variant="outline"
                                onClick={() => setIsCamera(false)}
                                className="w-full"
                            >
                                <X className="size-4" />
                                Cancel
                            </Button>
                            <Button
                                onClick={takePhoto}
                                disabled={uploadBeforePhoto.isPending || uploadAfterPhoto.isPending}
                                className="w-full"
                            >
                                <Check className="size-4" />
                                {uploadBeforePhoto.isPending || uploadAfterPhoto.isPending ? 'Uploading...' : 'Capture'}
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (isLoading) {
        return (
            <Card>
                <CardContent>
                    <div className="text-center py-8">
                        <p>Loading progress photos...</p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardContent>
                <div className="grid grid-cols-2 gap-3 mb-1">
                    {/* Before Picture */}
                    <div className="flex flex-col gap-3">
                        <div className="w-min self-center flex items-center gap-1 px-4 py-1 rounded-xl bg-orange-200">
                            <PersonStanding className="size-4 stroke-orange-400" />
                            <p className="text-sm font-bold">Before</p>
                        </div>
                        <div className="relative">
                            <div
                                className="bg-gray-100 rounded-lg h-32 flex items-center justify-center cursor-pointer border-2 border-dashed border-gray-300 hover:border-gray-400 transition-colors"
                                onClick={() => startCamera('before')}
                            >
                                {beforeImage ? (
                                    <img
                                        src={beforeImage}
                                        alt="Before"
                                        className="w-full h-full object-cover rounded-lg"
                                    />
                                ) : (
                                    <div className="text-center text-gray-500">
                                        <CameraIcon className="size-8 mx-auto mb-2" />
                                        <p className="text-xs">Tap to take photo</p>
                                    </div>
                                )}
                            </div>
                            {beforeImage && (
                                <Button
                                    variant="destructive"
                                    size="sm"
                                    className="absolute top-1 right-1 h-6 w-6 p-0"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleRemovePhoto('before');
                                    }}
                                >
                                    <Trash2 className="size-3" />
                                </Button>
                            )}
                        </div>
                    </div>

                    {/* After Picture */}
                    <div className="flex flex-col gap-3">
                        <div className="w-min self-center flex items-center gap-2 px-4 py-1 rounded-xl bg-green-200">
                            <BicepsFlexed className="size-4 stroke-green-400" />
                            <p className="text-sm font-bold">After</p>
                        </div>
                        <div className="relative">
                            <div
                                className="bg-gray-100 rounded-lg h-32 flex items-center justify-center cursor-pointer border-2 border-dashed border-gray-300 hover:border-gray-400 transition-colors"
                                onClick={() => startCamera('after')}
                            >
                                {afterImage ? (
                                    <img
                                        src={afterImage}
                                        alt="After"
                                        className="w-full h-full object-cover rounded-lg"
                                    />
                                ) : (
                                    <div className="text-center text-gray-500">
                                        <CameraIcon className="size-8 mx-auto mb-2" />
                                        <p className="text-xs">Tap to take photo</p>
                                    </div>
                                )}
                            </div>
                            {afterImage && (
                                <Button
                                    variant="destructive"
                                    size="sm"
                                    className="absolute top-1 right-1 h-6 w-6 p-0"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleRemovePhoto('after');
                                    }}
                                >
                                    <Trash2 className="size-3" />
                                </Button>
                            )}
                        </div>
                    </div>
                </div>

                {progressPhotos?.has_complete_comparison && (
                    <div className="text-center text-sm text-gray-600 mt-2">
                        Progress tracked for {progressPhotos.progress_duration_days || 0} days
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

export { BeforeAndAfterPicture };