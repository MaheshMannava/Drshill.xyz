"use client";

import { useState } from "react";
import { Button } from "../ui/button";
import { Dialog, DialogContent } from "../ui/dialog";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { ArrowLeft, Check, Upload } from "lucide-react";

interface CreateMemeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateMemeDialog({ open, onOpenChange }: CreateMemeDialogProps) {
  const [formData, setFormData] = useState({
    tickerName: "",
    creatorName: "",
    missionStatement: "",
    image: null as File | null,
    isRug: false,
  });

  const handleSubmit = async () => {
    // TODO: Handle form submission
    console.log(formData);
    onOpenChange(false);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.size <= 1024 * 1024) {
      // 1MB
      setFormData(prev => ({ ...prev, image: file }));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl p-0 gap-0 bg-gray-100">
        {/* Header */}

        {/* Content */}
        <div className="p-6 bg-[#FFFBE6]">
          <div className="flex items-center mb-6">
            <Button variant="ghost" size="icon" className="mr-4" onClick={() => onOpenChange(false)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex-1">
              <h2 className="text-xl font-serif">MAKE A MEME</h2>
              <p className="text-sm text-gray-600">COSTS 60 TICKETS</p>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <Label className="text-sm font-medium mb-2 block">TICKER NAME *</Label>
              <Input
                className="bg-white border-gray-200"
                value={formData.tickerName}
                onChange={e =>
                  setFormData(prev => ({
                    ...prev,
                    tickerName: e.target.value,
                  }))
                }
              />
            </div>

            <div>
              <Label className="text-sm font-medium mb-2 block">CREATOR NAME *</Label>
              <Input
                className="bg-white border-gray-200"
                value={formData.creatorName}
                onChange={e =>
                  setFormData(prev => ({
                    ...prev,
                    creatorName: e.target.value,
                  }))
                }
              />
            </div>

            <div>
              <Label className="text-sm font-medium mb-2 block">MISSION STATEMENT *</Label>
              <Textarea
                className="bg-white border-gray-200 min-h-[100px]"
                value={formData.missionStatement}
                onChange={e =>
                  setFormData(prev => ({
                    ...prev,
                    missionStatement: e.target.value,
                  }))
                }
              />
            </div>

            <div>
              <Label className="text-sm font-medium mb-2 block">IMAGE *</Label>
              <div className="flex gap-4">
                <div className="flex-1 border-2 border-dashed border-gray-300 rounded-lg p-4 flex flex-col items-center justify-center bg-white min-h-[150px]">
                  <Upload className="h-6 w-6 text-gray-400 mb-2" />
                  <Button
                    variant="ghost"
                    className="text-sm text-gray-600"
                    onClick={() => document.getElementById("file-upload")?.click()}
                  >
                    SELECT FILE
                  </Button>
                  <input
                    type="file"
                    id="file-upload"
                    className="hidden"
                    accept=".png,.jpg,.gif"
                    onChange={handleFileSelect}
                  />
                  <div className="text-xs text-gray-500 mt-2">
                    <p>• PNG, JPG, GIF</p>
                    <p>• 1MB MAXIMUM</p>
                    <p>• RECOMMENDED SIZE: 512 x 512 PX</p>
                  </div>
                </div>
                <div className="flex flex-col items-center justify-center w-24">
                  <span className="text-sm text-gray-600 mb-2">RUG?</span>
                  <Button
                    variant="outline"
                    className={`h-12 w-12 rounded-lg border-2 border-gray-300 p-0 ${formData.isRug ? "bg-green-50" : "bg-white"}`}
                    onClick={() => setFormData(prev => ({ ...prev, isRug: !prev.isRug }))}
                  >
                    {formData.isRug && <Check className="h-6 w-6 text-green-500" />}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* Footer */}
        <div className="p-6 bg-[#FFFBE6]">
          <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white h-12" onClick={handleSubmit}>
            SUBMIT
            <Upload className="h-5 w-5 ml-2" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
