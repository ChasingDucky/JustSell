import React from 'react';
import { Rate } from 'antd';

interface RatingStarsProps {
  value: number;
  onChange?: (value: number) => void;
  disabled?: boolean;
  allowHalf?: boolean;
  showValue?: boolean;
}

const RatingStars: React.FC<RatingStarsProps> = ({
  value,
  onChange,
  disabled = false,
  allowHalf = true,
  showValue = false,
}) => {
  return (
    <span>
      <Rate
        value={value}
        onChange={onChange}
        disabled={disabled}
        allowHalf={allowHalf}
        style={{ color: '#faad14' }}
      />
      {showValue && <span style={{ marginLeft: 8 }}>{value.toFixed(1)}</span>}
    </span>
  );
};

export default RatingStars;
