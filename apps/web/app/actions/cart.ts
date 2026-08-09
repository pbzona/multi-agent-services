"use server";

import { revalidatePath } from "next/cache";
import { CommerceError, setCartItemQuantity } from "../_lib/commerce";

export type CartActionState = {
  message: string;
  ok: boolean;
};

export async function updateCartAction(
  _previousState: CartActionState,
  formData: FormData,
): Promise<CartActionState> {
  const variantId = String(formData.get("variantId") ?? "");
  const quantity = Number(formData.get("quantity"));

  if (
    !variantId ||
    !Number.isInteger(quantity) ||
    quantity < 0 ||
    quantity > 999
  ) {
    return { ok: false, message: "Choose a valid quantity." };
  }

  try {
    await setCartItemQuantity(variantId, quantity);
    revalidatePath("/cart");
    return {
      ok: true,
      message: quantity === 0 ? "Removed from cart." : "Cart updated.",
    };
  } catch (cause) {
    return {
      ok: false,
      message:
        cause instanceof CommerceError
          ? cause.message
          : "The cart could not be updated.",
    };
  }
}
