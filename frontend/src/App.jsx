import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./components/ui/tabs";
import { Button } from "./components/ui/button";
import { Textarea } from "./components/ui/textarea";
import { Alert, AlertDescription } from "./components/ui/alert";
import {
  Users,
  ChefHat,
  Leaf,
  Target,
  Clock,
  Utensils,
  TrendingUp,
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
  BarChart3,
  AlertCircle,
  CheckCircle2,
  Info,
  Send,
  X,
  Star,
} from "lucide-react";

const API_URL = "http://localhost:3001/api";

const Toast = ({ message, description, type = "success", onClose }) => {
  const bgColor =
    type === "success"
      ? "bg-green-100 border-green-400"
      : "bg-red-100 border-red-400";

  const iconColor = type === "success" ? "text-green-700" : "text-red-700";

  return (
    <div className="fixed top-6 right-6 z-[9999]">
      <div
        className={`p-5 rounded-xl border-2 shadow-2xl ${bgColor} max-w-md w-[360px]`}
      >
        <div className="flex items-start gap-3">
          {type === "success" && (
            <CheckCircle2 className={`w-6 h-6 ${iconColor} flex-shrink-0`} />
          )}
          {type === "error" && (
            <AlertCircle className={`w-6 h-6 ${iconColor} flex-shrink-0`} />
          )}

          <div className="flex-1">
            <p className="font-bold text-base text-gray-900">{message}</p>

            {description && (
              <p className="text-sm text-gray-800 mt-1 leading-snug">
                {description}
              </p>
            )}
          </div>

          <button
            onClick={onClose}
            className="text-gray-700 hover:text-black transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress bar (super visible + professional) */}
        <div className="mt-4 h-2 w-full bg-white/60 rounded-full overflow-hidden">
          <div
            className={`h-full ${
              type === "success" ? "bg-green-600" : "bg-red-600"
            } animate-[toastBar_6s_linear_forwards]`}
          />
        </div>
      </div>

      {/* Animation CSS inside JSX */}
      <style>
        {`
          @keyframes toastBar {
            from { width: 100%; }
            to { width: 0%; }
          }
        `}
      </style>
    </div>
  );
};

const logger = {
  info: (message, data = {}) => console.log(`[INFO] ${message}`, data),
  error: (message, error = {}) => console.error(`[ERROR] ${message}`, error),
};

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    logger.error("Component error caught", { error, errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <Alert variant="destructive" className="m-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Something went wrong. Please refresh the page.</AlertDescription>
        </Alert>
      );
    }
    return this.props.children;
  }
}
const StarRating = ({ rating, onRatingChange, readonly = false }) => {
  const [hoverRating, setHoverRating] = useState(0);

  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={readonly}
          onMouseEnter={() => !readonly && setHoverRating(star)}
          onMouseLeave={() => !readonly && setHoverRating(0)}
          onClick={() => !readonly && onRatingChange(star)}
          className={`transition-all ${readonly ? 'cursor-default' : 'cursor-pointer hover:scale-110'}`}
        >
          <Star
            className={`w-8 h-8 ${
              star <= (hoverRating || rating)
                ? "fill-yellow-400 text-yellow-400"
                : "text-gray-300"
            }`}
          />
        </button>
      ))}
    </div>
  );
};

const StudentDashboard = ({ showToast }) => {
  const [lunchPreference, setLunchPreference] = useState({ eating: "yes", portion: "medium" });
  const [dinnerPreference, setDinnerPreference] = useState({ eating: "yes", portion: "medium" });
  const [feedback, setFeedback] = useState("");
  const [feedbackRating, setFeedbackRating] = useState(0);
  const [activeTab, setActiveTab] = useState("booking");
  
  // Weekly menu voting state
  const [weeklyMenuOptions, setWeeklyMenuOptions] = useState({});
  const [selectedWeeklyVotes, setSelectedWeeklyVotes] = useState({});
  const [weeklyVoteResults, setWeeklyVoteResults] = useState({});

  const [menu, setMenu] = useState({ lunch: null, dinner: null });
  const [crowdStats, setCrowdStats] = useState({ lunch: 0, dinner: 0 });
  const [loading, setLoading] = useState(false);

  const studentId = React.useMemo(() => {
  const n = Math.floor(Math.random() * 500) + 1;
  return `STU${String(n).padStart(3, "0")}`;
}, []);


  useEffect(() => {
    logger.info("StudentDashboard mounted");
    fetchMenu();
    fetchCrowdStats();
    fetchWeeklyMenuOptions();
    fetchWeeklyVoteResults();
    return () => logger.info("StudentDashboard unmounted");
  }, []);;

  const fetchMenu = async () => {
    try {
      const response = await fetch(`${API_URL}/menu/today`);
      const data = await response.json();
      setMenu(data);
    } catch (error) {
      logger.error("Error fetching menu", error);
      showToast("Failed to load menu", "", "error");
    }
  };

  const fetchCrowdStats = async () => {
  try {
    const response = await fetch(`${API_URL}/stats/today`);
    const data = await response.json();
    setCrowdStats({
      lunch: (data.lunch.yes || 0) + (data.lunch.limited || 0) + (data.lunch.tiffin || 0),
      dinner: (data.dinner.yes || 0) + (data.dinner.limited || 0) + (data.dinner.tiffin || 0),
    });
  } catch (error) {
    logger.error("Error fetching crowd stats", error);
  }
};

  const fetchWeeklyMenuOptions = async () => {
    try {
      const res = await fetch(`${API_URL}/voting/weekly-options`);
      const data = await res.json();
      setWeeklyMenuOptions(data);
    } catch (err) {
      logger.error("Error loading weekly menu options", err);
    }
  };

  const fetchWeeklyVoteResults = async () => {
    try {
      const res = await fetch(`${API_URL}/voting/weekly-results`);
      const data = await res.json();
      setWeeklyVoteResults(data);
    } catch (err) {
      logger.error("Error loading vote results", err);
    }
  };

  const submitWeeklyVote = async (day, mealType) => {
    try {
      const voteKey = `${day}_${mealType}`;
      const selected = selectedWeeklyVotes[voteKey];

      if (!selected) {
        showToast("Please select an option to vote!", "", "error");
        return;
      }

      const res = await fetch(`${API_URL}/voting/weekly-vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          student_id: studentId,
          day: day,
          meal_type: mealType,
          option_text: selected,
        }),
      });

      const data = await res.json();

      if (data.success) {
        showToast("Vote submitted ✅", `${day} ${mealType}: ${selected}`, "success");
        fetchWeeklyVoteResults();
      } else {
        showToast("Vote failed", "", "error");
      }
    } catch (err) {
      logger.error("Error submitting vote", err);
      showToast("Vote failed", "", "error");
    }
  };


  const handleConfirmMeal = async (mealType) => {
  try {
    setLoading(true);
    const preference = mealType === "lunch" ? lunchPreference : dinnerPreference;
    logger.info(`Confirming ${mealType} preference`, preference);

    const response = await fetch(`${API_URL}/preferences`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        student_id: studentId,
        meal_type: mealType,
        eating_status: preference.eating,
        portion_size: preference.portion,
      }),
    });

    const data = await response.json();

    if (data.success) {
      const portionGrams = {
        small: "200g",
        medium: "300g",
        large: "400g"
      };

      const eatStatus =
        preference.eating === "yes"
          ? "eat full meal"
          : preference.eating === "limited"
          ? "eat selected items"
          : preference.eating === "tiffin"
          ? "take tiffin"
          : "skip";

      showToast(
        `${mealType.charAt(0).toUpperCase() + mealType.slice(1)} preference confirmed!`,
        `You'll ${eatStatus} - ${portionGrams[preference.portion]}`,
        "success"
      );
      
      // ✅ REFRESH CROWD STATS AFTER SAVING
      fetchCrowdStats();
      
    } else {
      throw new Error("Failed to save preference");
    }
  } catch (error) {
    logger.error(`Error confirming ${mealType}`, error);
    showToast("Failed to confirm meal preference", "", "error");
  } finally {
    setLoading(false);
  }
};

  const handleSubmitFeedback = async () => {
    try {
      if (feedbackRating === 0) {
        showToast("Please provide a star rating", "", "error");
        return;
      }

      setLoading(true);
      logger.info("Submitting feedback", { feedback, rating: feedbackRating });

      const response = await fetch(`${API_URL}/feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          student_id: studentId,
          feedback_text: feedback || `${feedbackRating}-star rating`,
          rating: feedbackRating,
          meal_type: "general",
        }),
      });

      const data = await response.json();

      if (data.success) {
        showToast("Feedback submitted successfully!", "", "success");
        setFeedback("");
        setFeedbackRating(0);
      } else {
        throw new Error("Failed to submit feedback");
      }
    } catch (error) {
      logger.error("Error submitting feedback", error);
      showToast("Failed to submit feedback", "", "error");
    } finally {
      setLoading(false);
    }
  };

  const MealCard = ({ mealType, time, menuItems, preference, setPreference }) => (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Utensils className="w-5 h-5" />
            <CardTitle className="text-lg">{mealType}</CardTitle>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Clock className="w-4 h-4" />
            {time}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <h4 className="font-medium mb-2">Today's Menu</h4>
            <div className="text-sm space-y-1">
              {menuItems && menuItems.length > 0 ? (
                menuItems.map((item, idx) => (
                  <p key={idx} className="text-gray-600">
                    {item}
                  </p>
                ))
              ) : (
                <p className="text-gray-400">Loading menu...</p>
              )}
            </div>
          </div>

          <div>
            <h4 className="font-medium mb-3">Will you eat this meal?</h4>
            <div className="space-y-2">
              {[
                { value: "yes", label: "Yes, full meal", icon: CheckCircle2, color: "text-green-600" },
                { value: "limited", label: "Selected items only", icon: Info, color: "text-orange-600" },
                { value: "tiffin", label: "Take tiffin/parcel", icon: Info, color: "text-purple-600" },
                { value: "skip", label: "Skip this meal", icon: X, color: "text-red-600" },
              ].map(({ value, label, icon: Icon, color }) => (
                <button
                  key={value}
                  onClick={() => setPreference({ ...preference, eating: value })}
                  className={`w-full flex items-center gap-2 p-3 rounded-lg border-2 transition-all ${
                    preference.eating === value
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <Icon className={`w-4 h-4 ${preference.eating === value ? color : ""}`} />
                  <span className="text-sm">{label}</span>
                </button>
              ))}
            </div>
          </div>

          {preference.eating !== "skip" && (
            <div>
              <h4 className="font-medium mb-3">Portion Size</h4>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { value: "small", label: "Small", desc: "200g", dots: 1 },
                  { value: "medium", label: "Medium", desc: "300g", dots: 2 },
                  { value: "large", label: "Large", desc: "400g", dots: 3 },
                ].map(({ value, label, desc, dots }) => (
                  <button
                    key={value}
                    onClick={() => setPreference({ ...preference, portion: value })}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      preference.portion === value
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className="flex justify-center gap-1 mb-2 text-gray-700">
                      {[...Array(dots)].map((_, i) => (
                        <div key={i} className="w-2 h-2 rounded-full bg-current" />
                      ))}
                    </div>
                    <div className="font-medium text-sm">{label}</div>
                    <div className="text-xs text-gray-500">{desc}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          <Button
            onClick={() => handleConfirmMeal(mealType.toLowerCase())}
            className="w-full"
            size="lg"
            disabled={loading}
          >
            {loading ? "Saving..." : `Confirm ${mealType} Preference`}
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-blue-500 text-white rounded-lg">
              <Info className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold mb-1">Help reduce food waste!</h3>
              <p className="text-sm text-gray-600">
                Pre-booking your meals helps the mess prepare the right amount of food. Please confirm
                your attendance before 10 AM for lunch and 5 PM for dinner.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="booking" className="flex items-center gap-2">
            <Utensils className="w-4 h-4" />
            <span className="hidden sm:inline">Meal Booking</span>
            <span className="sm:hidden">Meals</span>
          </TabsTrigger>
          <TabsTrigger value="voting" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            <span className="hidden sm:inline">Menu Voting</span>
            <span className="sm:hidden">Vote</span>
          </TabsTrigger>
          <TabsTrigger value="feedback" className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
            <span className="hidden sm:inline">Feedback</span>
            <span className="sm:hidden">Feedback</span>
          </TabsTrigger>
          <TabsTrigger value="crowd" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            <span className="hidden sm:inline">Crowd Status</span>
            <span className="sm:hidden">Crowd</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="booking" className="space-y-6 mt-6">
          <div className="grid md:grid-cols-2 gap-6">
            <MealCard
              mealType="Lunch"
              time="12:30 PM - 2:00 PM"
              menuItems={menu.lunch?.items}
              preference={lunchPreference}
              setPreference={setLunchPreference}
            />
            <MealCard
              mealType="Dinner"
              time="7:30 PM - 9:00 PM"
              menuItems={menu.dinner?.items}
              preference={dinnerPreference}
              setPreference={setDinnerPreference}
            />
          </div>
        </TabsContent>

        <TabsContent value="voting" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Vote for Next Week's Menu (Day-wise)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <Alert className="bg-blue-50 border-blue-200">
                <Info className="h-4 w-4" />
                <AlertDescription>
                  Vote for your preferred menu for each day next week. Each day has unique menu options.
                </AlertDescription>
              </Alert>

              {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map((day) => (
                <div key={day} className="border rounded-lg p-4 bg-gray-50">
                  <h3 className="font-bold text-lg mb-4 text-blue-700">{day}</h3>

                  <div className="grid md:grid-cols-2 gap-4">
                    {/* Lunch */}
                    <div className="bg-white p-4 rounded-lg border">
                      <h4 className="font-semibold mb-3 flex items-center gap-2">
                        <Utensils className="w-4 h-4" />
                        Lunch Options
                      </h4>

                      <div className="space-y-2">
                        {(weeklyMenuOptions[day]?.lunch || []).map((option, idx) => {
                          const voteKey = `${day}_lunch`;
                          const isSelected = selectedWeeklyVotes[voteKey] === option;
                          const voteCount = weeklyVoteResults[voteKey]?.[option] || 0;

                          return (
                            <button
                              key={idx}
                              onClick={() =>
                                setSelectedWeeklyVotes({ ...selectedWeeklyVotes, [voteKey]: option })
                              }
                              className={`w-full p-3 rounded-lg border-2 text-left transition ${
                                isSelected
                                  ? "border-green-500 bg-green-50"
                                  : "border-gray-200 hover:border-gray-300"
                              }`}
                            >
                              <div className="font-medium text-sm">{option}</div>
                              <div className="text-xs text-gray-500 mt-1">Votes: {voteCount}</div>
                            </button>
                          );
                        })}
                      </div>

                      <Button
                        size="sm"
                        className="w-full mt-3"
                        onClick={() => submitWeeklyVote(day, "lunch")}
                      >
                        Vote for Lunch
                      </Button>
                    </div>

                    {/* Dinner */}
                    <div className="bg-white p-4 rounded-lg border">
                      <h4 className="font-semibold mb-3 flex items-center gap-2">
                        <Utensils className="w-4 h-4" />
                        Dinner Options
                      </h4>

                      <div className="space-y-2">
                        {(weeklyMenuOptions[day]?.dinner || []).map((option, idx) => {
                          const voteKey = `${day}_dinner`;
                          const isSelected = selectedWeeklyVotes[voteKey] === option;
                          const voteCount = weeklyVoteResults[voteKey]?.[option] || 0;

                          return (
                            <button
                              key={idx}
                              onClick={() =>
                                setSelectedWeeklyVotes({ ...selectedWeeklyVotes, [voteKey]: option })
                              }
                              className={`w-full p-3 rounded-lg border-2 text-left transition ${
                                isSelected
                                  ? "border-blue-500 bg-blue-50"
                                  : "border-gray-200 hover:border-gray-300"
                              }`}
                            >
                              <div className="font-medium text-sm">{option}</div>
                              <div className="text-xs text-gray-500 mt-1">Votes: {voteCount}</div>
                            </button>
                          );
                        })}
                      </div>

                      <Button
                        size="sm"
                        className="w-full mt-3"
                        onClick={() => submitWeeklyVote(day, "dinner")}
                      >
                        Vote for Dinner
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>


        <TabsContent value="feedback" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                Share Your Feedback
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-600">
                Your feedback helps us improve food quality and reduce waste.
              </p>

              {/* STAR RATING */}
              <div>
                <label className="text-sm font-medium mb-2 block">Rate today's food</label>
                <StarRating rating={feedbackRating} onRatingChange={setFeedbackRating} />
                <p className="text-xs text-gray-500 mt-2">
                  {feedbackRating === 0 && "Click to rate"}
                  {feedbackRating === 1 && "⭐ Poor - Major improvements needed"}
                  {feedbackRating === 2 && "⭐⭐ Below Average - Needs improvement"}
                  {feedbackRating === 3 && "⭐⭐⭐ Average - Acceptable"}
                  {feedbackRating === 4 && "⭐⭐⭐⭐ Good - Satisfactory"}
                  {feedbackRating === 5 && "⭐⭐⭐⭐⭐ Excellent - Outstanding quality"}
                </p>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Additional Comments (Optional)</label>
                <Textarea
                  placeholder="Tell us about food quality, taste, temperature, portion sizes, or any suggestions..."
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  rows={4}
                />
              </div>

              <div className="flex gap-2">
                <Button onClick={handleSubmitFeedback} className="flex-1" disabled={loading}>
                  <Send className="w-4 h-4 mr-2" />
                  {loading ? "Submitting..." : "Submit Feedback"}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => { setFeedback(""); setFeedbackRating(0); }} 
                  disabled={loading}
                >
                  Clear
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="crowd" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Current Crowd Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                    <div className="text-2xl font-bold text-green-700">{crowdStats.lunch}</div>
                    <div className="text-sm text-gray-600">Confirmed for Lunch</div>
                  </div>

                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="text-2xl font-bold text-blue-700">{crowdStats.dinner}</div>
                    <div className="text-sm text-gray-600">Confirmed for Dinner</div>
                  </div>
                </div>

                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    Live crowd tracking helps the mess prepare accurate quantities and reduce waste.
                  </AlertDescription>
                </Alert>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

const MessManagerDashboard = () => {
  const [stats, setStats] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const [feedback, setFeedback] = useState([]);
  const [loading, setLoading] = useState(true);
const [weeklyMenuDraft, setWeeklyMenuDraft] = useState({});

    // ✅ Menu update states (Manager)
  const [menuDraftLunch, setMenuDraftLunch] = useState("");
  const [menuDraftDinner, setMenuDraftDinner] = useState("");
  const [menuSaving, setMenuSaving] = useState(false);
  const [menuLoading, setMenuLoading] = useState(false);
  const [menuData, setMenuData] = useState({ lunch: null, dinner: null });

   useEffect(() => {
    logger.info("MessManagerDashboard mounted");
    fetchAllData();
    fetchMenuForManager();
    return () => logger.info("MessManagerDashboard unmounted");
  }, []);
    // ✅ Fetch today's menu for manager edit
  const fetchMenuForManager = async () => {
    try {
      setMenuLoading(true);
      const res = await fetch(`${API_URL}/menu/today`);
      const data = await res.json();

      setMenuData(data);

      // Fill textarea with existing values
      const lunchItems = data?.lunch?.items || [];
      const dinnerItems = data?.dinner?.items || [];

      setMenuDraftLunch(lunchItems.join("\n"));
      setMenuDraftDinner(dinnerItems.join("\n"));
    } catch (err) {
      console.error("Error loading menu for manager:", err);
    } finally {
      setMenuLoading(false);
    }
  };

  // ✅ Save menu to backend
  const saveMenu = async (mealType) => {
    try {
      setMenuSaving(true);

      const itemsText = mealType === "lunch" ? menuDraftLunch : menuDraftDinner;

      // Convert textarea lines into array
      const items = itemsText
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line.length > 0);

      if (items.length === 0) {
        alert("Please enter at least 1 menu item.");
        return;
      }

      const res = await fetch(`${API_URL}/menu/set`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          meal_type: mealType,
          items: items,
        }),
      });

      const data = await res.json();

      if (!data.success) {
        alert("Failed to update menu. Check backend terminal.");
        return;
      }

      alert(`${mealType.toUpperCase()} menu updated successfully ✅`);
      fetchMenuForManager(); // reload updated menu
    } catch (err) {
      console.error("Error saving menu:", err);
      alert("Error updating menu. Check console.");
    } finally {
      setMenuSaving(false);
    }
  };

const fetchAllData = async () => {
  try {
    setLoading(true);

    const [statsRes, metricsRes, feedbackRes, weeklyOptionsRes] = await Promise.all([
      fetch(`${API_URL}/stats/today`),
      fetch(`${API_URL}/metrics`),
      fetch(`${API_URL}/feedback/recent?limit=5`),
      fetch(`${API_URL}/voting/weekly-options`),
    ]);

    const statsData = await statsRes.json();
    const metricsData = await metricsRes.json();
    const feedbackData = await feedbackRes.json();
    const weeklyOptionsData = await weeklyOptionsRes.json();

    setStats(statsData);
    setMetrics(metricsData);
    setFeedback(feedbackData);
    setWeeklyMenuDraft(weeklyOptionsData);
  } catch (error) {
    logger.error("Error fetching manager data", error);
  } finally {
    setLoading(false);
  }
};

const saveWeeklyVotingOptions = async () => {
  try {
    const formattedOptions = {};
    
    ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].forEach((day) => {
      if (weeklyMenuDraft[day]) {
        formattedOptions[day] = {
          lunch: weeklyMenuDraft[day]?.lunch
            ?.split("\n")
            .map((x) => x.trim())
            .filter(Boolean) || [],
          dinner: weeklyMenuDraft[day]?.dinner
            ?.split("\n")
            .map((x) => x.trim())
            .filter(Boolean) || [],
        };
      }
    });

    const res = await fetch(`${API_URL}/voting/weekly-options`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formattedOptions),
    });

    const data = await res.json();

    if (data.success) {
      alert("✅ Weekly voting options updated!");
      fetchAllData();
    } else {
      alert("❌ Failed to update voting options");
    }
  } catch (err) {
    console.error(err);
    alert("❌ Error saving options");
  }
};

  const MetricCard = ({ title, value, change, icon: Icon, color, trend }) => (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-gray-500 mb-1">{title}</p>
            <p className="text-3xl font-bold">{value}</p>
            {change && (
              <p
                className={`text-sm mt-2 flex items-center gap-1 ${
                  trend === "up" ? "text-green-600" : "text-red-600"
                }`}
              >
                <TrendingUp className={`w-4 h-4 ${trend === "down" ? "rotate-180" : ""}`} />
                {change}
              </p>
            )}
          </div>
          <div className={`p-3 rounded-lg ${color}`}>
            <Icon className="w-6 h-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {loading ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-gray-500">Loading dashboard data...</p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {metrics && (
              <>
                <MetricCard
                  title="Waste Reduction"
                  value={metrics.wasteReduction.value}
                  change={metrics.wasteReduction.change}
                  icon={Leaf}
                  color="bg-green-100 text-green-700"
                  trend={metrics.wasteReduction.trend}
                />
                <MetricCard
                  title="Cost Savings"
                  value={metrics.costSavings.value}
                  change={metrics.costSavings.change}
                  icon={TrendingUp}
                  color="bg-blue-100 text-blue-700"
                  trend={metrics.costSavings.trend}
                />
                <MetricCard
                  title="Confirmation Rate"
                  value={metrics.confirmationRate.value}
                  change={metrics.confirmationRate.change}
                  icon={CheckCircle2}
                  color="bg-purple-100 text-purple-700"
                  trend={metrics.confirmationRate.trend}
                />
                <MetricCard
                  title="Avg Satisfaction"
                  value={metrics.avgSatisfaction.value}
                  change={metrics.avgSatisfaction.change}
                  icon={ThumbsUp}
                  color="bg-orange-100 text-orange-700"
                  trend={metrics.avgSatisfaction.trend}
                />
              </>
            )}
          </div>
          

	<Card>
  <CardHeader>
    <CardTitle>Manage Weekly Menu Voting Options</CardTitle>
  </CardHeader>
  <CardContent className="space-y-6">
    <Alert>
      <Info className="h-4 w-4" />
      <AlertDescription>
        Set unique menu options for each day of the week. Students vote for their preferred menu. Enter one option per line.
      </AlertDescription>
    </Alert>

    {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map((day) => (
      <div key={day} className="border rounded-lg p-4 bg-gray-50">
        <h3 className="font-semibold mb-3 text-blue-700">{day}</h3>
        
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Lunch Options</label>
            <Textarea
              value={weeklyMenuDraft[day]?.lunch || ""}
              onChange={(e) =>
                setWeeklyMenuDraft({
                  ...weeklyMenuDraft,
                  [day]: { 
                    ...weeklyMenuDraft[day], 
                    lunch: e.target.value 
                  },
                })
              }
              rows={4}
              placeholder="Menu 1: Dal Makhani + Rice + Salad&#10;Menu 2: Chole + Kulcha + Raita&#10;Menu 3: Rajma + Jeera Rice"
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Dinner Options</label>
            <Textarea
              value={weeklyMenuDraft[day]?.dinner || ""}
              onChange={(e) =>
                setWeeklyMenuDraft({
                  ...weeklyMenuDraft,
                  [day]: { 
                    ...weeklyMenuDraft[day], 
                    dinner: e.target.value 
                  },
                })
              }
              rows={4}
              placeholder="Menu 1: Paneer Tikka + Naan + Dal&#10;Menu 2: Mix Veg + Roti + Raita&#10;Menu 3: Aloo Gobi + Paratha"
            />
          </div>
        </div>
      </div>
    ))}

    <Button className="w-full" onClick={saveWeeklyVotingOptions}>
      Save All Weekly Options
    </Button>
  </CardContent>
</Card>
		

          {/* ✅ Manager Menu Update Section */}
          <Card className="border-2 border-blue-200 bg-blue-50/40">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Utensils className="w-5 h-5" />
                Update Today's Menu (Manager)
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-6">
              {menuLoading ? (
                <p className="text-sm text-gray-600">Loading menu...</p>
              ) : (
                <>
                  <div className="grid md:grid-cols-2 gap-6">
                    {/* Lunch */}
                    <div className="bg-white rounded-xl border p-4">
                      <h3 className="font-semibold mb-2 text-gray-900">Lunch Menu</h3>
                      <p className="text-xs text-gray-500 mb-3">
                        Enter 1 item per line (example: Dal + Rice)
                      </p>

                      <Textarea
                        value={menuDraftLunch}
                        onChange={(e) => setMenuDraftLunch(e.target.value)}
                        rows={6}
                        placeholder="Dal Tadka + Rice&#10;Veg Curry + Raita&#10;Dessert..."
                      />

                      <div className="flex gap-2 mt-4">
                        <Button
                          onClick={() => saveMenu("lunch")}
                          disabled={menuSaving}
                          className="flex-1"
                        >
                          {menuSaving ? "Saving..." : "Save Lunch Menu"}
                        </Button>

                        <Button
                          variant="outline"
                          onClick={fetchMenuForManager}
                          disabled={menuSaving}
                        >
                          Reload
                        </Button>
                      </div>
                    </div>

                    {/* Dinner */}
                    <div className="bg-white rounded-xl border p-4">
                      <h3 className="font-semibold mb-2 text-gray-900">Dinner Menu</h3>
                      <p className="text-xs text-gray-500 mb-3">
                        Enter 1 item per line (example: Paneer + Roti)
                      </p>

                      <Textarea
                        value={menuDraftDinner}
                        onChange={(e) => setMenuDraftDinner(e.target.value)}
                        rows={6}
                        placeholder="Paneer Butter Masala + Roti&#10;Dal Fry&#10;Ice Cream..."
                      />

                      <div className="flex gap-2 mt-4">
                        <Button
                          onClick={() => saveMenu("dinner")}
                          disabled={menuSaving}
                          className="flex-1"
                        >
                          {menuSaving ? "Saving..." : "Save Dinner Menu"}
                        </Button>

                        <Button
                          variant="outline"
                          onClick={fetchMenuForManager}
                          disabled={menuSaving}
                        >
                          Reload
                        </Button>
                      </div>
                    </div>
                  </div>

                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                      After saving, students will automatically see the updated menu in the Meal Booking section.
                    </AlertDescription>
                  </Alert>
                </>
              )}
            </CardContent>
          </Card>



          <div className="grid lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Today's Meal Bookings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {stats && (
                  <>
                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between mb-2">
                          <span className="text-sm font-medium">Lunch Confirmations</span>
                          <span className="text-sm text-gray-500">
                            {(stats.lunch.yes || 0) + (stats.lunch.limited || 0) + (stats.lunch.tiffin || 0)} / 500 students
                          </span>
			</div>
			<div className="w-full bg-gray-200 rounded-full h-3">
  			  <div
    			     className="bg-green-500 h-3 rounded-full"
                             style={{
                                width: `${(((stats.lunch.yes || 0) + (stats.lunch.limited || 0) + (stats.lunch.tiffin || 0)) / 500) * 100}%`,
                             }}
                            />
                       </div>
                      </div>

                      <div>
                        <div className="flex justify-between mb-2">
  				<span className="text-sm font-medium">Dinner Confirmations</span>
  				<span className="text-sm text-gray-500">
    					{(stats.dinner.yes || 0) + (stats.dinner.limited || 0) + (stats.dinner.tiffin || 0)} / 500 students
 			 </span>
			</div>
			<div className="w-full bg-gray-200 rounded-full h-3">
  				<div
    					className="bg-blue-500 h-3 rounded-full"
    					style={{
      						width: `${(((stats.dinner.yes || 0) + (stats.dinner.limited || 0) + (stats.dinner.tiffin || 0)) / 500) * 100}%`,
   				 	}}
  				/>
			</div>
                      </div>
                    </div>

                    <div className="pt-4 border-t grid grid-cols-3 gap-3 text-center">
                      <div>
                        <p className="text-2xl font-bold">
                          {stats.lunch.portions.medium + stats.dinner.portions.medium}
                        </p>
                        <p className="text-xs text-gray-500">Medium portions</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold">
                          {stats.lunch.portions.small + stats.dinner.portions.small}
                        </p>
                        <p className="text-xs text-gray-500">Small portions</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold">
                          {stats.lunch.portions.large + stats.dinner.portions.large}
                        </p>
                        <p className="text-xs text-gray-500">Large portions</p>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Feedback with Ratings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {feedback.length > 0 ? (
                    feedback.map((item, idx) => (
                      <div key={idx} className="p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <span className="font-medium text-sm">{item.name}</span>
                            <div className="flex gap-1 mt-1">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                  key={star}
                                  className={`w-4 h-4 ${
                                    star <= item.rating
                                      ? "fill-yellow-400 text-yellow-400"
                                      : "text-gray-300"
                                  }`}
                                />
                              ))}
                            </div>
                          </div>
                          <span className="text-xs text-gray-500">{item.time}</span>
                        </div>
                        {item.feedback && item.feedback !== `${item.rating}-star rating` && (
                          <p className="text-sm text-gray-600 mt-2">{item.feedback}</p>
                        )}
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500 text-center py-4">No feedback yet</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Weekly Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <Alert>
                <BarChart3 className="h-4 w-4" />
                <AlertDescription>
                  Advanced analytics and charts showing waste reduction trends, meal preferences,
                  and cost savings over time would be displayed here in the full implementation.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default function App() {
  const [activeView, setActiveView] = useState("student");
  const [toasts, setToasts] = useState([]);
  const toastIdRef = React.useRef(0);

  useEffect(() => {
    logger.info("App initialized", { timestamp: new Date().toISOString() });
  }, []);

  const showToast = (message, description = "", type = "success") => {
    const id = toastIdRef.current++;
    const newToast = { id, message, description, type };
    setToasts((prev) => [...prev, newToast]);

    setTimeout(() => {
      removeToast(id);
    }, 6000);
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  const handleViewChange = (view) => {
    try {
      logger.info("View changed", { from: activeView, to: view });
      setActiveView(view);
    } catch (error) {
      logger.error("Error changing view", error);
    }
  };

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            message={toast.message}
            description={toast.description}
            type={toast.type}
            onClose={() => removeToast(toast.id)}
          />
        ))}

        {/* Header */}
        <div className="bg-white border-b shadow-sm sticky top-0 z-50">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-green-500 to-blue-600 rounded-lg text-white">
                  <Leaf className="w-6 h-6" />
                </div>

                <div>
                  <h1 className="font-bold text-xl">NOURISH-HUB</h1>
                  <p className="text-xs text-gray-600">Smart Hostel Food Management System</p>
                </div>
              </div>

              <div className="flex items-center gap-2 text-sm">
                <div className="hidden sm:flex items-center gap-1 px-3 py-1 bg-green-100 rounded-full">
                  <Target className="w-3 h-3 text-green-700" />
                  <span className="text-xs font-medium text-green-700">
                    Target: 25–35% waste reduction
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="container mx-auto px-4 py-8">
          <Card className="mb-6 bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200">
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
                <div className="flex-1">
                  <h3 className="font-semibold mb-1">About NOURISH-HUB Prototype</h3>
                  <p className="text-sm text-gray-600">
                    This high-fidelity prototype demonstrates a smart, feedback-driven meal
                    management system that captures student meal intent and portion preferences
                    before cooking, enabling mess managers to plan preparation accurately and reduce
                    food waste.
                  </p>
                </div>

                <div className="flex gap-2 shrink-0">
                  <div className="text-center p-3 bg-white rounded-lg border">
                    <p className="text-xl font-bold">500</p>
                    <p className="text-xs text-gray-600">Students</p>
                  </div>

                  <div className="text-center p-3 bg-white rounded-lg border">
                    <p className="text-xl font-bold">1.2k</p>
                    <p className="text-xs text-gray-600">Meals/Day</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Tabs value={activeView} onValueChange={handleViewChange} className="w-full">
            <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-6 h-auto p-1">
              <TabsTrigger value="student" className="flex items-center gap-2 py-3">
                <Users className="w-5 h-5" />
                <div className="text-left">
                  <div className="font-medium">Student View</div>
                  <div className="text-xs text-gray-500">Book meals & provide feedback</div>
                </div>
              </TabsTrigger>

              <TabsTrigger value="manager" className="flex items-center gap-2 py-3">
                <ChefHat className="w-5 h-5" />
                <div className="text-left">
                  <div className="font-medium">Manager View</div>
                  <div className="text-xs text-gray-500">Analytics & insights</div>
                </div>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="student" className="mt-0">
              <StudentDashboard showToast={showToast} />
            </TabsContent>

            <TabsContent value="manager" className="mt-0">
              <MessManagerDashboard />
            </TabsContent>
          </Tabs>

          <div className="mt-12 pt-6 border-t text-center text-sm text-gray-500">
            <p>NOURISH-HUB Prototype v1.0 • Hostel Food Management System</p>
            <p className="mt-1 text-xs">
              Designed to reduce food waste, improve satisfaction, and optimize mess operations
            </p>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
}
