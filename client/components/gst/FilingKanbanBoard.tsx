import React, { useEffect, useState } from "react";
import { useGSTStore } from "@/store/gstStore";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Loader2, ChevronRight, Lock, Unlock, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

/**
 * FilingKanbanBoard - Visualize GST filings in a Kanban-style board
 * Shows filing workflows by status: Draft -> Prepared -> Validated -> Filed -> Locked
 */

interface FilingCardData {
  id: string;
  clientId: string;
  clientName?: string;
  month: string;
  financialYear: string;
  workflowStatus: string;
  gstr1?: { filed?: boolean; arn?: string };
  gstr3b?: { filed?: boolean; arn?: string };
  isLocked?: boolean;
}

const KANBAN_COLUMNS = [
  { id: "draft", title: "Draft", color: "bg-slate-100" },
  { id: "prepared", title: "Prepared", color: "bg-blue-100" },
  { id: "validated", title: "Validated", color: "bg-amber-100" },
  { id: "filed", title: "Filed", color: "bg-green-100" },
  { id: "locked", title: "Locked", color: "bg-purple-100" },
];

interface FilingKanbanBoardProps {
  clientId?: string;
  onFilingSelect?: (filing: FilingCardData) => void;
}

export const FilingKanbanBoard: React.FC<FilingKanbanBoardProps> = ({
  clientId,
  onFilingSelect,
}) => {
  const { filings } = useGSTStore();
  const [selectedFiling, setSelectedFiling] = useState<FilingCardData | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [transitionLoading, setTransitionLoading] = useState(false);
  const { toast } = useToast();

  // Get filings for display
  const displayFilings: FilingCardData[] = clientId
    ? filings[clientId] || []
    : Object.values(filings).flat();

  // Group filings by status
  const groupedByStatus = React.useMemo(() => {
    const grouped: Record<string, FilingCardData[]> = {};
    KANBAN_COLUMNS.forEach((col) => {
      grouped[col.id] = displayFilings.filter((f) => f.workflowStatus === col.id);
    });
    return grouped;
  }, [displayFilings]);

  const handleFilingClick = (filing: FilingCardData) => {
    setSelectedFiling(filing);
    setShowDialog(true);
    onFilingSelect?.(filing);
  };

  const handleTransition = async (toStatus: string) => {
    if (!selectedFiling) return;

    setTransitionLoading(true);
    try {
      const response = await fetch(`/api/filings/${selectedFiling.id}/transition`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("authToken")}`,
        },
        body: JSON.stringify({
          toStatus,
          stepType: `${toStatus}_step`,
          comments: `Transitioned to ${toStatus}`,
        }),
      });

      if (!response.ok) throw new Error("Failed to transition filing");

      toast({
        title: "Success",
        description: `Filing moved to ${toStatus}`,
      });

      setShowDialog(false);
      setSelectedFiling(null);

      // Refresh filings (in real app, use React Query or state management)
      window.location.reload();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to transition filing",
        variant: "destructive",
      });
    } finally {
      setTransitionLoading(false);
    }
  };

  const handleLockFiling = async () => {
    if (!selectedFiling) return;

    setTransitionLoading(true);
    try {
      const response = await fetch(`/api/filings/${selectedFiling.id}/lock`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("authToken")}`,
        },
        body: JSON.stringify({
          reason: "Monthly filing complete",
        }),
      });

      if (!response.ok) throw new Error("Failed to lock filing");

      toast({
        title: "Success",
        description: "Filing locked successfully",
      });

      setShowDialog(false);
      setSelectedFiling(null);
      window.location.reload();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to lock filing",
        variant: "destructive",
      });
    } finally {
      setTransitionLoading(false);
    }
  };

  return (
    <div className="w-full h-full overflow-x-auto">
      <div className="flex gap-6 p-6 min-w-max">
        {KANBAN_COLUMNS.map((column) => (
          <div key={column.id} className="flex flex-col w-72 gap-4">
            {/* Column Header */}
            <div className={`${column.color} rounded-lg p-4`}>
              <h3 className="font-semibold text-sm">{column.title}</h3>
              <p className="text-xs text-gray-600">
                {groupedByStatus[column.id].length} filings
              </p>
            </div>

            {/* Cards */}
            <div className="flex flex-col gap-3 flex-1">
              {groupedByStatus[column.id].map((filing) => (
                <FilingCard
                  key={filing.id}
                  filing={filing}
                  onClick={() => handleFilingClick(filing)}
                />
              ))}

              {groupedByStatus[column.id].length === 0 && (
                <div className="text-center py-8 text-gray-400 text-sm">
                  No filings
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Filing Details Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Filing Details</DialogTitle>
            <DialogDescription>
              {selectedFiling?.clientName} - {selectedFiling?.month}
            </DialogDescription>
          </DialogHeader>

          {selectedFiling && (
            <div className="space-y-6">
              {/* Filing Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Month</label>
                  <p className="text-sm text-gray-600">{selectedFiling.month}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Financial Year</label>
                  <p className="text-sm text-gray-600">{selectedFiling.financialYear}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Status</label>
                  <Badge variant="outline" className="mt-1">
                    {selectedFiling.workflowStatus}
                  </Badge>
                </div>
                <div>
                  <label className="text-sm font-medium">Locked</label>
                  <p className="text-sm text-gray-600">
                    {selectedFiling.isLocked ? "Yes" : "No"}
                  </p>
                </div>
              </div>

              {/* GSTR-1 & GSTR-3B Status */}
              <div className="space-y-3">
                <h4 className="font-medium text-sm">Filing Status</h4>
                <div className="flex gap-4">
                  <FilingStatusBadge
                    form="GSTR-1"
                    filed={selectedFiling.gstr1?.filed || false}
                    arn={selectedFiling.gstr1?.arn}
                  />
                  <FilingStatusBadge
                    form="GSTR-3B"
                    filed={selectedFiling.gstr3b?.filed || false}
                    arn={selectedFiling.gstr3b?.arn}
                  />
                </div>
              </div>

              {/* Action Buttons */}
              {selectedFiling.workflowStatus !== "locked" && (
                <div className="flex gap-2">
                  {selectedFiling.workflowStatus === "filed" && (
                    <Button
                      onClick={handleLockFiling}
                      disabled={transitionLoading}
                      variant="default"
                      size="sm"
                    >
                      {transitionLoading && (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      )}
                      <Lock className="w-4 h-4 mr-2" />
                      Lock Month
                    </Button>
                  )}

                  {selectedFiling.workflowStatus === "draft" && (
                    <Button
                      onClick={() => handleTransition("prepared")}
                      disabled={transitionLoading}
                      variant="outline"
                      size="sm"
                    >
                      {transitionLoading && (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      )}
                      <ChevronRight className="w-4 h-4 mr-2" />
                      Start Preparation
                    </Button>
                  )}

                  {selectedFiling.workflowStatus === "prepared" && (
                    <Button
                      onClick={() => handleTransition("validated")}
                      disabled={transitionLoading}
                      variant="outline"
                      size="sm"
                    >
                      {transitionLoading && (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      )}
                      <ChevronRight className="w-4 h-4 mr-2" />
                      Validate
                    </Button>
                  )}

                  {selectedFiling.workflowStatus === "validated" && (
                    <Button
                      onClick={() => handleTransition("filed")}
                      disabled={transitionLoading}
                      variant="outline"
                      size="sm"
                    >
                      {transitionLoading && (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      )}
                      <FileText className="w-4 h-4 mr-2" />
                      Mark as Filed
                    </Button>
                  )}
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button onClick={() => setShowDialog(false)} variant="outline">
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

/**
 * FilingCard - Individual filing card for Kanban board
 */
const FilingCard: React.FC<{
  filing: FilingCardData;
  onClick: () => void;
}> = ({ filing, onClick }) => {
  return (
    <Card
      onClick={onClick}
      className="p-4 cursor-pointer hover:shadow-md transition-shadow"
    >
      <div className="space-y-2">
        <div className="flex items-start justify-between">
          <div>
            <p className="font-medium text-sm truncate">
              {filing.clientName || filing.clientId.slice(0, 8)}
            </p>
            <p className="text-xs text-gray-500">{filing.month}</p>
          </div>
          {filing.isLocked && (
            <Lock className="w-4 h-4 text-amber-600" title="Locked" />
          )}
        </div>

        <div className="flex gap-2 flex-wrap">
          {filing.gstr1?.filed && (
            <Badge variant="secondary" className="text-xs">
              GSTR-1 ✓
            </Badge>
          )}
          {filing.gstr3b?.filed && (
            <Badge variant="secondary" className="text-xs">
              GSTR-3B ✓
            </Badge>
          )}
        </div>
      </div>
    </Card>
  );
};

/**
 * FilingStatusBadge - Show GSTR-1/3B filing status
 */
const FilingStatusBadge: React.FC<{
  form: string;
  filed: boolean;
  arn?: string;
}> = ({ form, filed, arn }) => {
  return (
    <div className="space-y-1">
      <p className="text-sm font-medium">{form}</p>
      {filed ? (
        <div className="space-y-1">
          <Badge variant="default" className="text-xs">
            Filed
          </Badge>
          {arn && (
            <p className="text-xs text-gray-600">
              <span className="font-medium">ARN:</span> {arn}
            </p>
          )}
        </div>
      ) : (
        <Badge variant="outline" className="text-xs">
          Pending
        </Badge>
      )}
    </div>
  );
};

export default FilingKanbanBoard;
