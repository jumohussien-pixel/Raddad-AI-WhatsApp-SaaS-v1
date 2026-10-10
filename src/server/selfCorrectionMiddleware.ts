/**
 * Self-Correction Sizing & Validation Middleware (English Edition)
 * 
 * Analyzes customer inputs before passing to Gemini or Local Intelligence:
 * 1. Extracts Weight (supports kg and lbs) and Height (supports cm and feet/inches).
 * 2. Cross-references against the Apparel Sizing Standard Matrix.
 * 3. Identifies and reconciles logical discrepancies (e.g., 110 lbs wanting XXL for oversized fit, or 220 lbs requesting M).
 * 4. Injects precise self-correction guidance into Gemini context and provides deterministic fallback in English.
 */

export interface SizingAnalysis {
  hasSizingIntent: boolean;
  detectedWeightKg: number | null;
  detectedWeightLbs: number | null;
  detectedHeightCm: number | null;
  detectedHeightFtIn: string | null;
  requestedSize: 'M' | 'L' | 'XL' | 'XXL' | '3XL' | null;
  recommendedStandardSize: 'M' | 'L' | 'XL' | 'XXL' | '3XL' | null;
  discrepancyType: 'PERFECT_MATCH' | 'UNDERSIZED_WANTS_OVERSIZED' | 'OVERSIZED_WANTS_TIGHT' | 'WEIGHT_ONLY' | 'SIZE_ONLY' | 'NONE';
  guidanceNote: string;
  deterministicReply?: string;
}

export function analyzeSizingInput(text: string): SizingAnalysis {
  const normalized = text.toLowerCase().trim();

  // 1. Extract Weight (supports kg/kilos and lbs/pounds)
  let detectedWeightKg: number | null = null;
  let detectedWeightLbs: number | null = null;

  // Check for lbs first
  const lbsMatch =
    normalized.match(/(?:weight|wazn|wazny)?\s*[:=\-]?\s*(\d{2,3})\s*(?:lbs|lb|pounds|pound)\b/i) ||
    normalized.match(/\b(\d{2,3})\s*(?:lbs|lb|pounds)\b/i);

  if (lbsMatch) {
    const lbsVal = parseInt(lbsMatch[1], 10);
    if (lbsVal >= 80 && lbsVal <= 400) {
      detectedWeightLbs = lbsVal;
      detectedWeightKg = Math.round(lbsVal * 0.453592);
    }
  } else {
    // Check for kg
    const kgMatch =
      normalized.match(/(?:weight|wazn|wazny|وزني|الوزن)?\s*[:=\-]?\s*(\d{2,3})\s*(?:kg|kilos|kilo|كيلو|كجم|ك)?/i) ||
      normalized.match(/\b(\d{2,3})\s*(?:kg|kilos|kilo|كيلو|كجم)\b/i);

    if (kgMatch) {
      const kgVal = parseInt(kgMatch[1], 10);
      if (kgVal >= 35 && kgVal <= 180) {
        detectedWeightKg = kgVal;
        detectedWeightLbs = Math.round(kgVal / 0.453592);
      }
    }
  }

  // 2. Extract Height (supports cm and feet/inches like 5'10 or 5ft 10in)
  let detectedHeightCm: number | null = null;
  let detectedHeightFtIn: string | null = null;

  // Check for feet/inches first
  const ftInMatch = normalized.match(/\b([4567])\s*(?:\'|ft|feet)\s*(\d{1,2})?\s*(?:\"|in|inches)?\b/i);
  if (ftInMatch) {
    const ft = parseInt(ftInMatch[1], 10);
    const inch = ftInMatch[2] ? parseInt(ftInMatch[2], 10) : 0;
    if (ft >= 4 && ft <= 7 && inch >= 0 && inch < 12) {
      detectedHeightFtIn = `${ft}'${inch}`;
      detectedHeightCm = Math.round(ft * 30.48 + inch * 2.54);
    }
  } else {
    // Check for cm
    const cmMatch =
      normalized.match(/(?:height|tool|tooly|طولي|الطول)\s*[:=\-]?\s*(\d{2,3})\s*(?:cm|سنتيمتر|سم)?/i) ||
      normalized.match(/\b(\d{2,3})\s*(?:cm|سنتيمتر|سم)\b/i);

    if (cmMatch) {
      const cmVal = parseInt(cmMatch[1], 10);
      if (cmVal >= 130 && cmVal <= 220) {
        detectedHeightCm = cmVal;
        // Convert to ft/in
        const totalInches = cmVal / 2.54;
        const ft = Math.floor(totalInches / 12);
        const inch = Math.round(totalInches % 12);
        detectedHeightFtIn = `${ft}'${inch}`;
      }
    }
  }

  // 3. Extract Requested Size (Arabic, Franco, English)
  let requestedSize: 'M' | 'L' | 'XL' | 'XXL' | '3XL' | null = null;
  if (/اكس اكس اكس لارج|3xl|٣\s*اكس|تلاتة\s*اكس|tlat[ea]\s*x|xxx\s*l|xxxl/i.test(normalized)) {
    requestedSize = '3XL';
  } else if (/اكس اكس لارج|xxl|٢\s*اكس|اتنين\s*اكس|etneen\s*x|2\s*xl|2xl|xx\s*l/i.test(normalized)) {
    requestedSize = 'XXL';
  } else if (/(?:^|\s)اكس لارج|l\s*extra|extra\s*large|\bxl\b|aks\s*l/i.test(normalized)) {
    requestedSize = 'XL';
  } else if (/(?:^|\s)لارج|\bl\b|large/i.test(normalized) && !/اكس|x/i.test(normalized)) {
    requestedSize = 'L';
  } else if (/ميديام|مديم|ميديم|medium|\bm\b/i.test(normalized)) {
    requestedSize = 'M';
  }

  // 4. Calculate Standard Recommended Size based on Weight
  let recommendedStandardSize: 'M' | 'L' | 'XL' | 'XXL' | '3XL' | null = null;
  if (detectedWeightKg !== null) {
    if (detectedWeightKg <= 68) recommendedStandardSize = 'M';
    else if (detectedWeightKg <= 80) recommendedStandardSize = 'L';
    else if (detectedWeightKg <= 92) recommendedStandardSize = 'XL';
    else if (detectedWeightKg <= 105) recommendedStandardSize = 'XXL';
    else recommendedStandardSize = '3XL';
  }

  // Determine Discrepancy & Validation Logic
  if (detectedWeightKg !== null && requestedSize !== null && recommendedStandardSize !== null) {
    const sizeHierarchy = { M: 1, L: 2, XL: 3, XXL: 4, '3XL': 5 };
    const recRank = sizeHierarchy[recommendedStandardSize];
    const reqRank = sizeHierarchy[requestedSize];

    const weightDisplay = detectedWeightLbs ? `${detectedWeightLbs} lbs` : `${detectedWeightKg} kg`;
    const heightDisplay = detectedHeightFtIn ? ` (${detectedHeightFtIn})` : detectedHeightCm ? ` (${detectedHeightCm} cm)` : '';

    // Case A: Customer weighs low but explicitly requests XXL or 3XL for oversized trend
    if (reqRank >= recRank + 2) {
      const note = `[SELF_CORRECTION] Customer weighs ${weightDisplay}${heightDisplay} with a standard recommended size of ${recommendedStandardSize}, but explicitly requested size ${requestedSize} for an oversized streetwear look. Action: Highly endorse their style preference, politely confirm that their standard size is ${recommendedStandardSize} but we will gladly prepare size ${requestedSize} to achieve their desired oversized fit perfectly without any hesitation!`;
      
      const deterministicReply = `أهلاً بحضرتك يا غالي! 🌟\nبناءً على وزنك ${weightDisplay}${heightDisplay}، مقاسك المظبوط هو ${recommendedStandardSize}، لكن بما إنك حابب ستايل أوفر سايز واسع وستريت وير بمقاس ${requestedSize}، ده اختيار جامد جداً وهيديك قصة مريحة وشياكة عالية! 👕✨\nتحب نجهزهولك هودي أو تيشيرت؟ وأنهي لون تفضله؟`;

      return {
        hasSizingIntent: true,
        detectedWeightKg,
        detectedWeightLbs,
        detectedHeightCm,
        detectedHeightFtIn,
        requestedSize,
        recommendedStandardSize,
        discrepancyType: 'UNDERSIZED_WANTS_OVERSIZED',
        guidanceNote: note,
        deterministicReply,
      };
    }

    // Case B: Customer has high weight but requests undersized M or L
    if (recRank >= reqRank + 2) {
      const note = `[SELF_CORRECTION] Customer weighs ${weightDisplay}${heightDisplay} with a standard recommended size of ${recommendedStandardSize}, but requested size ${requestedSize} which will be far too tight. Action: Politely warn them that size ${requestedSize} will be extremely tight, and strongly recommend size ${recommendedStandardSize} to ensure an elegant, comfortable fit that flows naturally with their body.`;

      const deterministicReply = `أهلاً بحضرتك يا فندم! 🌟\nبناءً على وزنك ${weightDisplay}${heightDisplay}، ننصحك جداً تختار مقاس ${recommendedStandardSize}، لأن مقاس ${requestedSize} هيكون ضيق جداً ومش مريح. مقاس ${recommendedStandardSize} هيديك راحة تامة وشكل مظبوط جداً على جسمك! ✨\nتحب نعتمد مقاس ${recommendedStandardSize}؟ وأنهي لون يناسبك؟ 👕`;

      return {
        hasSizingIntent: true,
        detectedWeightKg,
        detectedWeightLbs,
        detectedHeightCm,
        detectedHeightFtIn,
        requestedSize,
        recommendedStandardSize,
        discrepancyType: 'OVERSIZED_WANTS_TIGHT',
        guidanceNote: note,
        deterministicReply,
      };
    }

    // Case C: Perfect / Close Match
    const note = `[SELF_CORRECTION] Customer weighs ${weightDisplay}${heightDisplay} and their size request of ${requestedSize} is a perfect, logical match for our recommended size (${recommendedStandardSize}). Confirm item availability.`;
    return {
      hasSizingIntent: true,
      detectedWeightKg,
      detectedWeightLbs,
      detectedHeightCm,
      detectedHeightFtIn,
      requestedSize,
      recommendedStandardSize,
      discrepancyType: 'PERFECT_MATCH',
      guidanceNote: note,
    };
  }

  // Weight only provided
  if (detectedWeightKg !== null) {
    let deterministicReply = '';
    const weightDisplay = detectedWeightLbs ? `${detectedWeightLbs} رطل` : `${detectedWeightKg} كجم`;
    const heightDisplay = detectedHeightFtIn ? ` (${detectedHeightFtIn})` : detectedHeightCm ? ` (${detectedHeightCm} سم)` : '';

    if (detectedWeightKg <= 68) {
      deterministicReply = `منورنا يا غالي! 🌟 لوزنك ${weightDisplay}${heightDisplay}، مقاسك المظبوط في الملابس هو M، ولو حابب قصة أوفر سايز واسعة مقاس L هيكون ممتاز! تحب نجهزلك M ولا L؟ 👕`;
    } else if (detectedWeightKg <= 80) {
      deterministicReply = `منورنا يا غالي! 🌟 لوزنك ${weightDisplay}${heightDisplay}، مقاسك المظبوط هو L، وللأوفر سايز الواسع مقاس XL هيكون تحفة! سعر الهودي الأوفر سايز 650 جنيه مصري ومعاه معاينة وقياس قبل الدفع. تحب تختار L ولا XL؟ 👕`;
    } else if (detectedWeightKg <= 92) {
      deterministicReply = `منورنا يا غالي! 🌟 لوزنك ${weightDisplay}${heightDisplay}، مقاسك المظبوط هو XL، وللأوفر سايز الستريت وير مقاس XXL! تحب نجهزلك XL ولا XXL؟ ✨`;
    } else if (detectedWeightKg <= 105) {
      deterministicReply = `منورنا يا غالي! 🌟 لوزنك ${weightDisplay}${heightDisplay}، مقاس XXL هيكون مريح ومظبوط جداً عليك! تحب تختار أنهي لون؟ 👕`;
    } else {
      deterministicReply = `منورنا يا غالي! 🌟 لوزنك ${weightDisplay}${heightDisplay}، مقاس 3XL هو الأنسب والأريح تماماً! تحب تختار أي موديل؟ 👕`;
    }

    return {
      hasSizingIntent: true,
      detectedWeightKg,
      detectedWeightLbs,
      detectedHeightCm,
      detectedHeightFtIn,
      requestedSize: null,
      recommendedStandardSize,
      discrepancyType: 'WEIGHT_ONLY',
      guidanceNote: `[SELF_CORRECTION] Weight detected: ${weightDisplay}. Recommended size: ${recommendedStandardSize}.`,
      deterministicReply,
    };
  }

  // Size only provided
  if (requestedSize !== null) {
    return {
      hasSizingIntent: true,
      detectedWeightKg: null,
      detectedWeightLbs: null,
      detectedHeightCm: null,
      detectedHeightFtIn: null,
      requestedSize,
      recommendedStandardSize: null,
      discrepancyType: 'SIZE_ONLY',
      guidanceNote: `[SELF_CORRECTION] Customer explicitly requested size ${requestedSize} directly.`,
    };
  }

  return {
    hasSizingIntent: false,
    detectedWeightKg: null,
    detectedWeightLbs: null,
    detectedHeightCm: null,
    detectedHeightFtIn: null,
    requestedSize: null,
    recommendedStandardSize: null,
    discrepancyType: 'NONE',
    guidanceNote: '',
  };
}
