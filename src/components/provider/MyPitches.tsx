import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { pitchService } from "@/services/pitchService";
import { PitchResponse } from "@/types/pitch";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/utils/format";
import { format } from "date-fns";

export function MyPitches() {
  const [pitches, setPitches] = useState<PitchResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadPitches();
  }, []);

  const loadPitches = async () => {
    try {
      setLoading(true);
      const response = await pitchService.getMyPitches();
      setPitches(response.content);
      setError(null);
    } catch (err) {
      setError("Failed to load pitches");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "WIN":
        return "bg-green-500";
      case "LOSE":
        return "bg-red-500";
      case "PENDING":
        return "bg-yellow-500";
      default:
        return "bg-gray-500";
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div className="text-red-500">{error}</div>;
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">My Pitches</h2>
      {pitches.length === 0 ? (
        <p>You haven't made any pitches yet.</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {pitches.map((pitch) => (
            <Card key={pitch.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">
                    Pitch for Request #{pitch.requestId}
                  </CardTitle>
                  <Badge className={getStatusColor(pitch.status)}>
                    {pitch.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="text-sm text-gray-600">
                    {pitch.pitchDetails}
                  </p>
                  <div className="flex justify-between items-center">
                    <span className="font-semibold">
                      {formatCurrency(pitch.proposedPrice)}
                    </span>
                    <span className="text-sm text-gray-500">
                      {format(new Date(pitch.createdAt), "MMM d, yyyy")}
                    </span>
                  </div>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => navigate(`/provider/requests/${pitch.requestId}`)}
                  >
                    View Request
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
} 