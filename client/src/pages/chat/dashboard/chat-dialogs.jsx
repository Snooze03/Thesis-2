import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";

/**
 * Reusable dialogs for chat operations (rename and delete)
 */
export const ChatDialogs = ({
    renameDialog,
    deleteDialog,
    onRenameDialogChange,
    onDeleteDialogChange,
    onRenameSubmit,
    onDeleteConfirm,
    isRenamingChat,
    isDeletingChat
}) => {
    const [newTitle, setNewTitle] = useState('');

    // Update local title state when rename dialog opens
    const handleRenameDialogChange = (open) => {
        if (!open) {
            setNewTitle('');
            onRenameDialogChange({ open: false, chatId: null, currentTitle: '' });
        }
    };

    // Set initial title when dialog opens
    const handleDialogOpen = (open) => {
        if (open && renameDialog.currentTitle) {
            setNewTitle(renameDialog.currentTitle);
        }
        handleRenameDialogChange(open);
    };

    const handleRenameSubmit = async () => {
        if (!newTitle.trim() || !renameDialog.chatId) return;

        try {
            await onRenameSubmit(renameDialog.chatId, newTitle.trim());
            setNewTitle('');
            onRenameDialogChange({ open: false, chatId: null, currentTitle: '' });
        } catch (error) {
            console.error('Error renaming chat:', error);
        }
    };

    const handleDeleteDialogChange = (open) => {
        if (!open) {
            onDeleteDialogChange({ open: false, chatId: null, chatTitle: '' });
        }
    };

    const handleDeleteConfirm = async () => {
        if (!deleteDialog.chatId) return;

        try {
            await onDeleteConfirm(deleteDialog.chatId);
            onDeleteDialogChange({ open: false, chatId: null, chatTitle: '' });
        } catch (error) {
            console.error('Error deleting chat:', error);
        }
    };

    return (
        <>
            {/* Rename Dialog */}
            <Dialog
                open={renameDialog.open}
                onOpenChange={handleDialogOpen}
            >
                <DialogContent aria-describedby="rename-dialog-description" className="gap-0">
                    <DialogHeader>
                        <DialogTitle>Rename Chat</DialogTitle>
                    </DialogHeader>
                    <div className="py-3">
                        <p id="rename-dialog-description" className="text-sm text-muted-foreground mb-3">
                            Enter a new title for your chat conversation.
                        </p>
                        <Input
                            value={newTitle}
                            onChange={(e) => setNewTitle(e.target.value)}
                            placeholder="Enter new chat title"
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    handleRenameSubmit();
                                }
                            }}
                        />
                    </div>
                    <DialogFooter className="mt-2">
                        <Button variant="outline" onClick={() => handleRenameDialogChange(false)}>
                            Cancel
                        </Button>
                        <Button
                            onClick={handleRenameSubmit}
                            disabled={isRenamingChat || !newTitle.trim()}
                        >
                            {isRenamingChat ? (
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            ) : null}
                            Rename
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <AlertDialog
                open={deleteDialog.open}
                onOpenChange={handleDeleteDialogChange}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Chat</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete "{deleteDialog.chatTitle}"? This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => handleDeleteDialogChange(false)}>
                            Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDeleteConfirm}
                            disabled={isDeletingChat}
                            className={buttonVariants({ variant: "destructive" })}
                        >
                            {isDeletingChat ? (
                                "Deleting..."
                            ) : "Delete"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
};