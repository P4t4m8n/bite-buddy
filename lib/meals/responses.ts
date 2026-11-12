import { NextResponse } from "next/server";

import { invalidInput } from "@/lib/api/responses";
import { MEAL_ITEMS_MAX } from "@/lib/meals/schemas";

import type { MealWriteError } from "@/lib/meals/mutations";

/** HTTP response for a failed meal write. */
export const mealErrorResponse = (error: MealWriteError) => {
  switch (error) {
    case "not_found":
      return NextResponse.json(
        { error: "Not found", message: "הארוחה לא נמצאה." },
        { status: 404 },
      );
    case "forbidden":
      return NextResponse.json(
        { error: "Forbidden", message: "רק מי שיצר את הארוחה יכול לשנות אותה." },
        { status: 403 },
      );
    case "invalid_food":
      return invalidInput("אחד המוצרים לא נמצא.");
    case "too_many_items":
      return invalidInput(`ארוחה יכולה להכיל עד ${MEAL_ITEMS_MAX} מוצרים.`);
  }
};
