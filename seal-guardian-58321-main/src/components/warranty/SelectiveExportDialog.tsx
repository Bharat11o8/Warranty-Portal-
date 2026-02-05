import React, { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { WARRANTY_EXPORT_FIELDS } from "@/lib/adminExports";
import { Download, CheckSquare, Square } from "lucide-react";

interface SelectiveExportDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onExport: (selectedFields: string[]) => void;
    title?: string;
    description?: string;
}

export const SelectiveExportDialog: React.FC<SelectiveExportDialogProps> = ({
    isOpen,
    onClose,
    onExport,
    title = "Selective Export",
    description = "Select the fields you want to include in your export."
}) => {
    const [selectedFields, setSelectedFields] = useState<string[]>(WARRANTY_EXPORT_FIELDS.map(f => f.id));

    const toggleField = (fieldId: string) => {
        setSelectedFields(prev =>
            prev.includes(fieldId)
                ? prev.filter(id => id !== fieldId)
                : [...prev, fieldId]
        );
    };

    const selectAll = () => {
        setSelectedFields(WARRANTY_EXPORT_FIELDS.map(f => f.id));
    };

    const selectNone = () => {
        setSelectedFields([]);
    };

    const handleExport = () => {
        onExport(selectedFields);
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col p-0 overflow-hidden border-orange-100 rounded-[32px] shadow-2xl">
                <DialogHeader className="p-6 pb-2">
                    <DialogTitle className="text-2xl font-black text-slate-800 flex items-center gap-3">
                        <div className="p-2 bg-orange-100 rounded-xl">
                            <Download className="h-6 w-6 text-orange-600" />
                        </div>
                        {title}
                    </DialogTitle>
                    <DialogDescription className="text-slate-500 font-medium mt-2">
                        {description}
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto px-6 py-4 custom-scrollbar">
                    <div className="flex items-center justify-between mb-6 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                        <span className="text-sm font-bold text-slate-600">
                            {selectedFields.length} fields selected
                        </span>
                        <div className="flex gap-3">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={selectAll}
                                className="text-xs font-black uppercase tracking-widest text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                            >
                                <CheckSquare className="h-4 w-4 mr-2" />
                                Select All
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={selectNone}
                                className="text-xs font-black uppercase tracking-widest text-slate-400 hover:text-red-500 hover:bg-red-50"
                            >
                                <Square className="h-4 w-4 mr-2" />
                                Clear All
                            </Button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {WARRANTY_EXPORT_FIELDS.map((field) => (
                            <div
                                key={field.id}
                                className={`flex items-center space-x-3 p-3 rounded-xl border transition-all cursor-pointer group ${selectedFields.includes(field.id)
                                        ? 'bg-orange-50/50 border-orange-200'
                                        : 'bg-white border-slate-100 hover:border-orange-100 hover:bg-slate-50'
                                    }`}
                                onClick={() => toggleField(field.id)}
                            >
                                <Checkbox
                                    id={`field-${field.id}`}
                                    checked={selectedFields.includes(field.id)}
                                    className="data-[state=checked]:bg-orange-500 data-[state=checked]:border-orange-500"
                                    onCheckedChange={() => toggleField(field.id)}
                                />
                                <Label
                                    htmlFor={`field-${field.id}`}
                                    className={`flex-1 text-sm font-bold cursor-pointer transition-colors ${selectedFields.includes(field.id) ? 'text-orange-700' : 'text-slate-600'
                                        }`}
                                >
                                    {field.label}
                                </Label>
                            </div>
                        ))}
                    </div>
                </div>

                <DialogFooter className="p-6 pt-2 border-t border-slate-50 flex flex-col md:flex-row gap-3">
                    <Button
                        variant="outline"
                        onClick={onClose}
                        className="flex-1 h-12 rounded-2xl font-black uppercase tracking-widest text-slate-500 hover:bg-slate-50 border-slate-200"
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleExport}
                        disabled={selectedFields.length === 0}
                        className="flex-1 h-12 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white font-black uppercase tracking-widest shadow-lg shadow-orange-500/20 disabled:opacity-50"
                    >
                        Export CSV
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
