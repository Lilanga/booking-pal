import React, { useEffect, useState, useRef, useCallback } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

const Button = (props) => {
  const { disabled = false, ...restProps } = props;
  const [clicked, setClicked] = useState(false);
  const clickedTimerRef = useRef(null);
  const isUnmountedRef = useRef(false);

  const handleClick = useCallback((e) => {
    if (isUnmountedRef.current || clicked || disabled) {
      return;
    }

    setClicked(true);
    
    // Clear any existing timer
    if (clickedTimerRef.current) {
      clearTimeout(clickedTimerRef.current);
    }

    clickedTimerRef.current = setTimeout(() => {
      if (!isUnmountedRef.current) {
        setClicked(false);
      }
      clickedTimerRef.current = null;
    }, 1000);

    // Call the prop handler
    if (restProps.handleClick && typeof restProps.handleClick === 'function') {
      try {
        restProps.handleClick(e);
      } catch (error) {
        console.error('Error in button click handler:', error);
      }
    }
  }, [clicked, disabled, restProps.handleClick]);

  useEffect(() => {
    return () => {
      isUnmountedRef.current = true;
      if (clickedTimerRef.current) {
        clearTimeout(clickedTimerRef.current);
        clickedTimerRef.current = null;
      }
    };
  }, []);

  const iconClasses = classNames('icon', `icon-${restProps.icon}`);
  const btnClasses = classNames({
    clicked: clicked,
    disabled: disabled
  }, restProps.className);

  return (
    <button onClick={handleClick} className={btnClasses} disabled={clicked || disabled} type="button">
      <i className={iconClasses} />
    </button>
  );
};

Button.propTypes = {
  icon: PropTypes.string.isRequired,
  handleClick: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
  className: PropTypes.string
};


export default Button;
